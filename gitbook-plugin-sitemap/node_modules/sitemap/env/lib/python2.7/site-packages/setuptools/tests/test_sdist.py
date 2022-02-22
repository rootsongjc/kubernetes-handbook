# -*- coding: utf-8 -*-
"""sdist tests"""

import locale
import os
import shutil
import sys
import tempfile
import unittest
import unicodedata
import re
import contextlib
from setuptools.tests import environment, test_svn
from setuptools.tests.py26compat import skipIf

from setuptools.compat import StringIO, unicode, PY3, PY2
from setuptools.command.sdist import sdist, walk_revctrl
from setuptools.command.egg_info import manifest_maker
from setuptools.dist import Distribution
from setuptools import svn_utils

SETUP_ATTRS = {
    'name': 'sdist_test',
    'version': '0.0',
    'packages': ['sdist_test'],
    'package_data': {'sdist_test': ['*.txt']}
}


SETUP_PY = """\
from setuptools import setup

setup(**%r)
""" % SETUP_ATTRS


if PY3:
    LATIN1_FILENAME = 'smörbröd.py'.encode('latin-1')
else:
    LATIN1_FILENAME = 'sm\xf6rbr\xf6d.py'


# Cannot use context manager because of Python 2.4
@contextlib.contextmanager
def quiet():
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = StringIO(), StringIO()
    try:
        yield
    finally:
        sys.stdout, sys.stderr = old_stdout, old_stderr


# Fake byte literals for Python <= 2.5
def b(s, encoding='utf-8'):
    if PY3:
        return s.encode(encoding)
    return s


# Convert to POSIX path
def posix(path):
    if PY3 and not isinstance(path, str):
        return path.replace(os.sep.encode('ascii'), b('/'))
    else:
        return path.replace(os.sep, '/')


# HFS Plus uses decomposed UTF-8
def decompose(path):
    if isinstance(path, unicode):
        return unicodedata.normalize('NFD', path)
    try:
        path = path.decode('utf-8')
        path = unicodedata.normalize('NFD', path)
        path = path.encode('utf-8')
    except UnicodeError:
        pass  # Not UTF-8
    return path


class TestSdistTest(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        f = open(os.path.join(self.temp_dir, 'setup.py'), 'w')
        f.write(SETUP_PY)
        f.close()
        # Set up the rest of the test package
        test_pkg = os.path.join(self.temp_dir, 'sdist_test')
        os.mkdir(test_pkg)
        # *.rst was not included in package_data, so c.rst should not be
        # automatically added to the manifest when not under version control
        for fname in ['__init__.py', 'a.txt', 'b.txt', 'c.rst']:
            # Just touch the files; their contents are irrelevant
            open(os.path.join(test_pkg, fname), 'w').close()

        self.old_cwd = os.getcwd()
        os.chdir(self.temp_dir)

    def tearDown(self):
        os.chdir(self.old_cwd)
        shutil.rmtree(self.temp_dir)

    def test_package_data_in_sdist(self):
        """Regression test for pull request #4: ensures that files listed in
        package_data are included in the manifest even if they're not added to
        version control.
        """

        dist = Distribution(SETUP_ATTRS)
        dist.script_name = 'setup.py'
        cmd = sdist(dist)
        cmd.ensure_finalized()

        with quiet():
            cmd.run()

        manifest = cmd.filelist.files
        self.assertTrue(os.path.join('sdist_test', 'a.txt') in manifest)
        self.assertTrue(os.path.join('sdist_test', 'b.txt') in manifest)
        self.assertTrue(os.path.join('sdist_test', 'c.rst') not in manifest)

    def test_manifest_is_written_with_utf8_encoding(self):
        # Test for #303.
        dist = Distribution(SETUP_ATTRS)
        dist.script_name = 'setup.py'
        mm = manifest_maker(dist)
        mm.manifest = os.path.join('sdist_test.egg-info', 'SOURCES.txt')
        os.mkdir('sdist_test.egg-info')

        # UTF-8 filename
        filename = os.path.join('sdist_test', 'smörbröd.py')

        # Must create the file or it will get stripped.
        open(filename, 'w').close()

        # Add UTF-8 filename and write manifest
        with quiet():
            mm.run()
            mm.filelist.append(filename)
            mm.write_manifest()

        manifest = open(mm.manifest, 'rbU')
        contents = manifest.read()
        manifest.close()

        # The manifest should be UTF-8 encoded
        try:
            u_contents = contents.decode('UTF-8')
        except UnicodeDecodeError:
            e = sys.exc_info()[1]
            self.fail(e)

        # The manifest should contain the UTF-8 filename
        if PY2:
            fs_enc = sys.getfilesystemencoding()
            filename = filename.decode(fs_enc)

        self.assertTrue(posix(filename) in u_contents)

    # Python 3 only
    if PY3:

        def test_write_manifest_allows_utf8_filenames(self):
            # Test for #303.
            dist = Distribution(SETUP_ATTRS)
            dist.script_name = 'setup.py'
            mm = manifest_maker(dist)
            mm.manifest = os.path.join('sdist_test.egg-info', 'SOURCES.txt')
            os.mkdir('sdist_test.egg-info')

            # UTF-8 filename
            filename = os.path.join(b('sdist_test'), b('smörbröd.py'))

            # Must touch the file or risk removal
            open(filename, "w").close()

            # Add filename and write manifest
            with quiet():
                mm.run()
                u_filename = filename.decode('utf-8')
                mm.filelist.files.append(u_filename)
                # Re-write manifest
                mm.write_manifest()

            manifest = open(mm.manifest, 'rbU')
            contents = manifest.read()
            manifest.close()

            # The manifest should be UTF-8 encoded
            try:
                contents.decode('UTF-8')
            except UnicodeDecodeError:
                e = sys.exc_info()[1]
                self.fail(e)

            # The manifest should contain the UTF-8 filename
            self.assertTrue(posix(filename) in contents)

            # The filelist should have been updated as well
            self.assertTrue(u_filename in mm.filelist.files)

        def test_write_manifest_skips_non_utf8_filenames(self):
            """
            Files that cannot be encoded to UTF-8 (specifically, those that
            weren't originally successfully decoded and have surrogate
            escapes) should be omitted from the manifest.
            See https://bitbucket.org/tarek/distribute/issue/303 for history.
            """
            dist = Distribution(SETUP_ATTRS)
            dist.script_name = 'setup.py'
            mm = manifest_maker(dist)
            mm.manifest = os.path.join('sdist_test.egg-info', 'SOURCES.txt')
            os.mkdir('sdist_test.egg-info')

            # Latin-1 filename
            filename = os.path.join(b('sdist_test'), LATIN1_FILENAME)

            # Add filename with surrogates and write manifest
            with quiet():
                mm.run()
                u_filename = filename.decode('utf-8', 'surrogateescape')
                mm.filelist.append(u_filename)
                # Re-write manifest
                mm.write_manifest()

            manifest = open(mm.manifest, 'rbU')
            contents = manifest.read()
            manifest.close()

            # The manifest should be UTF-8 encoded
            try:
                contents.decode('UTF-8')
            except UnicodeDecodeError:
                e = sys.exc_info()[1]
                self.fail(e)

            # The Latin-1 filename should have been skipped
            self.assertFalse(posix(filename) in contents)

            # The filelist should have been updated as well
            self.assertFalse(u_filename in mm.filelist.files)

    def test_manifest_is_read_with_utf8_encoding(self):
        # Test for #303.
        dist = Distribution(SETUP_ATTRS)
        dist.script_name = 'setup.py'
        cmd = sdist(dist)
        cmd.ensure_finalized()

        # Create manifest
        with quiet():
            cmd.run()

        # Add UTF-8 filename to manifest
        filename = os.path.join(b('sdist_test'), b('smörbröd.py'))
        cmd.manifest = os.path.join('sdist_test.egg-info', 'SOURCES.txt')
        manifest = open(cmd.manifest, 'ab')
        manifest.write(b('\n') + filename)
        manifest.close()

        # The file must exist to be included in the filelist
        open(filename, 'w').close()

        # Re-read manifest
        cmd.filelist.files = []
        with quiet():
            cmd.read_manifest()

        # The filelist should contain the UTF-8 filename
        if PY3:
            filename = filename.decode('utf-8')
        self.assertTrue(filename in cmd.filelist.files)

    # Python 3 only
    if PY3:

        def test_read_manifest_skips_non_utf8_filenames(self):
            # Test for #303.
            dist = Distribution(SETUP_ATTRS)
            dist.script_name = 'setup.py'
            cmd = sdist(dist)
            cmd.ensure_finalized()

            # Create manifest
            with quiet():
                cmd.run()

            # Add Latin-1 filename to manifest
            filename = os.path.join(b('sdist_test'), LATIN1_FILENAME)
            cmd.manifest = os.path.join('sdist_test.egg-info', 'SOURCES.txt')
            manifest = open(cmd.manifest, 'ab')
            manifest.write(b('\n') + filename)
            manifest.close()

            # The file must exist to be included in the filelist
            open(filename, 'w').close()

            # Re-read manifest
            cmd.filelist.files = []
            with quiet():
                try:
                    cmd.read_manifest()
                except UnicodeDecodeError:
                    e = sys.exc_info()[1]
                    self.fail(e)

            # The Latin-1 filename should have been skipped
            filename = filename.decode('latin-1')
            self.assertFalse(filename in cmd.filelist.files)

    @skipIf(PY3 and locale.getpreferredencoding() != 'UTF-8',
            'Unittest fails if locale is not utf-8 but the manifests is recorded correctly')
    def test_sdist_with_utf8_encoded_filename(self):
        # Test for #303.
        dist = Distribution(SETUP_ATTRS)
        dist.script_name = 'setup.py'
        cmd = sdist(dist)
        cmd.ensure_finalized()

        # UTF-8 filename
        filename = os.path.join(b('sdist_test'), b('smörbröd.py'))
        open(filename, 'w').close()

        with quiet():
            cmd.run()

        if sys.platform == 'darwin':
            filename = decompose(filename)

        if PY3:
            fs_enc = sys.getfilesystemencoding()

            if sys.platform == 'win32':
                if fs_enc == 'cp1252':
                    # Python 3 mangles the UTF-8 filename
                    filename = filename.decode('cp1252')
                    self.assertTrue(filename in cmd.filelist.files)
                else:
                    filename = filename.decode('mbcs')
                    self.assertTrue(filename in cmd.filelist.files)
            else:
                filename = filename.decode('utf-8')
                self.assertTrue(filename in cmd.filelist.files)
        else:
            self.assertTrue(filename in cmd.filelist.files)

    def test_sdist_with_latin1_encoded_filename(self):
        # Test for #303.
        dist = Distribution(SETUP_ATTRS)
        dist.script_name = 'setup.py'
        cmd = sdist(dist)
        cmd.ensure_finalized()

        # Latin-1 filename
        filename = os.path.join(b('sdist_test'), LATIN1_FILENAME)
        open(filename, 'w').close()
        self.assertTrue(os.path.isfile(filename))

        with quiet():
            cmd.run()

        if PY3:
            # not all windows systems have a default FS encoding of cp1252
            if sys.platform == 'win32':
                # Latin-1 is similar to Windows-1252 however
                # on mbcs filesys it is not in latin-1 encoding
                fs_enc = sys.getfilesystemencoding()
                if fs_enc == 'mbcs':
                    filename = filename.decode('mbcs')
                else:
                    filename = filename.decode('latin-1')

                self.assertTrue(filename in cmd.filelist.files)
            else:
                # The Latin-1 filename should have been skipped
                filename = filename.decode('latin-1')
                self.assertFalse(filename in cmd.filelist.files)
        else:
            # Under Python 2 there seems to be no decoded string in the
            # filelist.  However, due to decode and encoding of the
            # file name to get utf-8 Manifest the latin1 maybe excluded
            try:
                # fs_enc should match how one is expect the decoding to
                # be proformed for the manifest output.
                fs_enc = sys.getfilesystemencoding()
                filename.decode(fs_enc)
                self.assertTrue(filename in cmd.filelist.files)
            except UnicodeDecodeError:
                self.assertFalse(filename in cmd.filelist.files)

class TestDummyOutput(environment.ZippedEnvironment):

    def setUp(self):
        self.datafile = os.path.join('setuptools', 'tests',
                                     'svn_data', "dummy.zip")
        self.dataname = "dummy"
        super(TestDummyOutput, self).setUp()

    def _run(self):
        code, data = environment.run_setup_py(["sdist"],
                                              pypath=self.old_cwd,
                                              data_stream=0)
        if code:
            info = "DIR: " + os.path.abspath('.')
            info += "\n  SDIST RETURNED: %i\n\n" % code
            info += data
            raise AssertionError(info)

        datalines = data.splitlines()

        possible = (
            "running sdist",
            "running egg_info",
            "creating dummy\.egg-info",
            "writing dummy\.egg-info",
            "writing top-level names to dummy\.egg-info",
            "writing dependency_links to dummy\.egg-info",
            "writing manifest file 'dummy\.egg-info",
            "reading manifest file 'dummy\.egg-info",
            "reading manifest template 'MANIFEST\.in'",
            "writing manifest file 'dummy\.egg-info",
            "creating dummy-0.1.1",
            "making hard links in dummy-0\.1\.1",
            "copying files to dummy-0\.1\.1",
            "copying \S+ -> dummy-0\.1\.1",
            "copying dummy",
            "copying dummy\.egg-info",
            "hard linking \S+ -> dummy-0\.1\.1",
            "hard linking dummy",
            "hard linking dummy\.egg-info",
            "Writing dummy-0\.1\.1",
            "creating dist",
            "creating 'dist",
            "Creating tar archive",
            "running check",
            "adding 'dummy-0\.1\.1",
            "tar .+ dist/dummy-0\.1\.1\.tar dummy-0\.1\.1",
            "gzip .+ dist/dummy-0\.1\.1\.tar",
            "removing 'dummy-0\.1\.1' \\(and everything under it\\)",
        )

        print("    DIR: " + os.path.abspath('.'))
        for line in datalines:
            found = False
            for pattern in possible:
                if re.match(pattern, line):
                    print("   READ: " + line)
                    found = True
                    break
            if not found:
                raise AssertionError("Unexpexected: %s\n-in-\n%s"
                                     % (line, data))

        return data

    def test_sources(self):
        self._run()


class TestSvn(environment.ZippedEnvironment):

    def setUp(self):
        version = svn_utils.SvnInfo.get_svn_version()
        if not version:  # None or Empty
            return

        self.base_version = tuple([int(x) for x in version.split('.')][:2])

        if not self.base_version:
            raise ValueError('No SVN tools installed')
        elif self.base_version < (1, 3):
            raise ValueError('Insufficient SVN Version %s' % version)
        elif self.base_version >= (1, 9):
            # trying the latest version
            self.base_version = (1, 8)

        self.dataname = "svn%i%i_example" % self.base_version
        self.datafile = os.path.join('setuptools', 'tests',
                                     'svn_data', self.dataname + ".zip")
        super(TestSvn, self).setUp()

    @skipIf(not test_svn._svn_check, "No SVN to text, in the first place")
    def test_walksvn(self):
        if self.base_version >= (1, 6):
            folder2 = 'third party2'
            folder3 = 'third party3'
        else:
            folder2 = 'third_party2'
            folder3 = 'third_party3'

        # TODO is this right
        expected = set([
            os.path.join('a file'),
            os.path.join(folder2, 'Changes.txt'),
            os.path.join(folder2, 'MD5SUMS'),
            os.path.join(folder2, 'README.txt'),
            os.path.join(folder3, 'Changes.txt'),
            os.path.join(folder3, 'MD5SUMS'),
            os.path.join(folder3, 'README.txt'),
            os.path.join(folder3, 'TODO.txt'),
            os.path.join(folder3, 'fin'),
            os.path.join('third_party', 'README.txt'),
            os.path.join('folder', folder2, 'Changes.txt'),
            os.path.join('folder', folder2, 'MD5SUMS'),
            os.path.join('folder', folder2, 'WatashiNiYomimasu.txt'),
            os.path.join('folder', folder3, 'Changes.txt'),
            os.path.join('folder', folder3, 'fin'),
            os.path.join('folder', folder3, 'MD5SUMS'),
            os.path.join('folder', folder3, 'oops'),
            os.path.join('folder', folder3, 'WatashiNiYomimasu.txt'),
            os.path.join('folder', folder3, 'ZuMachen.txt'),
            os.path.join('folder', 'third_party', 'WatashiNiYomimasu.txt'),
            os.path.join('folder', 'lalala.txt'),
            os.path.join('folder', 'quest.txt'),
            # The example will have a deleted file
            #  (or should) but shouldn't return it
        ])
        self.assertEqual(set(x for x in walk_revctrl()), expected)


def test_suite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)
