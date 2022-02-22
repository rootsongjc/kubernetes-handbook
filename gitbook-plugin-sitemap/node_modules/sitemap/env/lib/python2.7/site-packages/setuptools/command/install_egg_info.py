from distutils import log, dir_util
import os, sys

from setuptools import Command
from setuptools.archive_util import unpack_archive
import pkg_resources


class install_egg_info(Command):
    """Install an .egg-info directory for the package"""

    description = "Install an .egg-info directory for the package"

    user_options = [
        ('install-dir=', 'd', "directory to install to"),
    ]

    def initialize_options(self):
        self.install_dir = None
        self.install_layout = None
        self.prefix_option = None

    def finalize_options(self):
        self.set_undefined_options('install_lib',
                                   ('install_dir', 'install_dir'))
        self.set_undefined_options('install',('install_layout','install_layout'))
        if sys.hexversion > 0x2060000:
            self.set_undefined_options('install',('prefix_option','prefix_option'))
        ei_cmd = self.get_finalized_command("egg_info")
        basename = pkg_resources.Distribution(
            None, None, ei_cmd.egg_name, ei_cmd.egg_version
        ).egg_name() + '.egg-info'

        if self.install_layout:
            if not self.install_layout.lower() in ['deb']:
                raise DistutilsOptionError(
                    "unknown value for --install-layout")
            basename = basename.replace('-py%s' % pkg_resources.PY_MAJOR, '')
        elif self.prefix_option or 'real_prefix' in sys.__dict__:
            # don't modify for virtualenv
            pass
        else:
            basename = basename.replace('-py%s' % pkg_resources.PY_MAJOR, '')

        self.source = ei_cmd.egg_info
        self.target = os.path.join(self.install_dir, basename)
        self.outputs = [self.target]

    def run(self):
        self.run_command('egg_info')
        if os.path.isdir(self.target) and not os.path.islink(self.target):
            dir_util.remove_tree(self.target, dry_run=self.dry_run)
        elif os.path.exists(self.target):
            self.execute(os.unlink, (self.target,), "Removing " + self.target)
        if not self.dry_run:
            pkg_resources.ensure_directory(self.target)
        self.execute(
            self.copytree, (), "Copying %s to %s" % (self.source, self.target)
        )
        self.install_namespaces()

    def get_outputs(self):
        return self.outputs

    def copytree(self):
        # Copy the .egg-info tree to site-packages
        def skimmer(src, dst):
            # filter out source-control directories; note that 'src' is always
            # a '/'-separated path, regardless of platform.  'dst' is a
            # platform-specific path.
            for skip in '.svn/', 'CVS/':
                if src.startswith(skip) or '/' + skip in src:
                    return None
            self.outputs.append(dst)
            log.debug("Copying %s to %s", src, dst)
            return dst

        unpack_archive(self.source, self.target, skimmer)

    def install_namespaces(self):
        nsp = self._get_all_ns_packages()
        if not nsp:
            return
        filename, ext = os.path.splitext(self.target)
        filename += '-nspkg.pth'
        self.outputs.append(filename)
        log.info("Installing %s", filename)
        lines = map(self._gen_nspkg_line, nsp)

        if self.dry_run:
            # always generate the lines, even in dry run
            list(lines)
            return

        with open(filename, 'wt') as f:
            f.writelines(lines)

    _nspkg_tmpl = (
        "import sys, types, os",
        "p = os.path.join(sys._getframe(1).f_locals['sitedir'], *%(pth)r)",
        "ie = os.path.exists(os.path.join(p,'__init__.py'))",
        "m = not ie and "
            "sys.modules.setdefault(%(pkg)r, types.ModuleType(%(pkg)r))",
        "mp = (m or []) and m.__dict__.setdefault('__path__',[])",
        "(p not in mp) and mp.append(p)",
    )
    "lines for the namespace installer"

    _nspkg_tmpl_multi = (
        'm and setattr(sys.modules[%(parent)r], %(child)r, m)',
    )
    "additional line(s) when a parent package is indicated"

    @classmethod
    def _gen_nspkg_line(cls, pkg):
        # ensure pkg is not a unicode string under Python 2.7
        pkg = str(pkg)
        pth = tuple(pkg.split('.'))
        tmpl_lines = cls._nspkg_tmpl
        parent, sep, child = pkg.rpartition('.')
        if parent:
            tmpl_lines += cls._nspkg_tmpl_multi
        return ';'.join(tmpl_lines) % locals() + '\n'

    def _get_all_ns_packages(self):
        """Return sorted list of all package namespaces"""
        nsp = set()
        for pkg in self.distribution.namespace_packages or []:
            pkg = pkg.split('.')
            while pkg:
                nsp.add('.'.join(pkg))
                pkg.pop()
        return sorted(nsp)
