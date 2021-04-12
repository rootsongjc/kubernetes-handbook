#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
    nodeenv
    ~~~~~~~
    Node.js virtual environment

    :copyright: (c) 2014 by Eugene Kalinin
    :license: BSD, see LICENSE for more details.
"""

import contextlib
import io
import sys
import os
import re
import stat
import logging
import operator
import optparse
import subprocess
import tarfile
import pipes

try:  # pragma: no cover (py2 only)
    from ConfigParser import SafeConfigParser as ConfigParser
    from HTMLParser import HTMLParser
    from urllib2 import urlopen
    iteritems = operator.methodcaller('iteritems')
except ImportError:  # pragma: no cover (py3 only)
    from configparser import ConfigParser
    from html.parser import HTMLParser
    from urllib.request import urlopen
    iteritems = operator.methodcaller('items')

from pkg_resources import parse_version

nodeenv_version = '0.13.1'

join = os.path.join
abspath = os.path.abspath
src_domain = "nodejs.org"

is_PY3 = sys.version_info[0] == 3
if is_PY3:
    from functools import cmp_to_key
# ---------------------------------------------------------
# Utils


class Config(object):
    """
    Configuration namespace.
    """

    # Defaults
    node = 'latest'
    npm = 'latest'
    with_npm = False
    jobs = '2'
    without_ssl = False
    debug = False
    profile = False
    make = 'make'
    prebuilt = False

    @classmethod
    def _load(cls, configfiles, verbose=False):
        """
        Load configuration from the given files in reverse order,
        if they exist and have a [nodeenv] section.
        """
        for configfile in reversed(configfiles):
            configfile = os.path.expanduser(configfile)
            if not os.path.exists(configfile):
                continue

            ini_file = ConfigParser()
            ini_file.read(configfile)
            section = "nodeenv"
            if not ini_file.has_section(section):
                continue

            for attr, val in iteritems(vars(cls)):
                if attr.startswith('_') or not \
                   ini_file.has_option(section, attr):
                    continue

                if isinstance(val, bool):
                    val = ini_file.getboolean(section, attr)
                else:
                    val = ini_file.get(section, attr)

                if verbose:
                    print('CONFIG {0}: {1} = {2}'.format(
                        os.path.basename(configfile), attr, val))
                setattr(cls, attr, val)

    @classmethod
    def _dump(cls):
        """
        Print defaults for the README.
        """
        print("    [nodeenv]")
        print("    " + "\n    ".join(
            "%s = %s" % (k, v) for k, v in sorted(iteritems(vars(cls)))
            if not k.startswith('_')))


Config._default = dict(
    (attr, val) for attr, val in iteritems(vars(Config))
    if not attr.startswith('_')
)


def clear_output(out):
    """
    Remove new-lines and
    """
    return out.decode('utf-8').replace('\n', '')


def remove_env_bin_from_path(env, env_bin_dir):
    """
    Remove bin directory of the current environment from PATH
    """
    return env.replace(env_bin_dir + ':', '')


def node_version_from_opt(opt):
    """
    Parse the node version from the optparse options
    """
    if opt.node == 'system':
        out, err = subprocess.Popen(
            ["node", "--version"], stdout=subprocess.PIPE).communicate()
        return parse_version(clear_output(out).replace('v', ''))

    return parse_version(opt.node)


def create_logger():
    """
    Create logger for diagnostic
    """
    # create logger
    logger = logging.getLogger("nodeenv")
    logger.setLevel(logging.INFO)

    # monkey patch
    def emit(self, record):
        msg = self.format(record)
        fs = "%s" if getattr(record, "continued", False) else "%s\n"
        self.stream.write(fs % msg)
        self.flush()
    logging.StreamHandler.emit = emit

    # create console handler and set level to debug
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)

    # create formatter
    formatter = logging.Formatter(fmt="%(message)s")

    # add formatter to ch
    ch.setFormatter(formatter)

    # add ch to logger
    logger.addHandler(ch)
    return logger
logger = create_logger()


def parse_args(check=True):
    """
    Parses command line arguments.

    Set `check` to False to skip validation checks.
    """
    parser = optparse.OptionParser(
        version=nodeenv_version,
        usage="%prog [OPTIONS] ENV_DIR")

    parser.add_option(
        '-n', '--node', dest='node', metavar='NODE_VER', default=Config.node,
        help='The node.js version to use, e.g., '
        '--node=0.4.3 will use the node-v0.4.3 '
        'to create the new environment. '
        'The default is last stable version (`latest`). '
        'Use `system` to use system-wide node.')

    parser.add_option(
        '-i', '--iojs',
        action='store_true', dest='io', default=False,
        help='Use iojs instead of nodejs.')

    parser.add_option(
        '-j', '--jobs', dest='jobs', default=Config.jobs,
        help='Sets number of parallel commands at node.js compilation. '
        'The default is 2 jobs.')

    parser.add_option(
        '--load-average', dest='load_average',
        help='Sets maximum load average for executing parallel commands '
             'at node.js compilation.')

    parser.add_option(
        '-v', '--verbose',
        action='store_true', dest='verbose', default=False,
        help="Verbose mode")

    parser.add_option(
        '-q', '--quiet',
        action='store_true', dest='quiet', default=False,
        help="Quiet mode")

    parser.add_option(
        '-C', '--config-file', dest='config_file', default=None,
        help="Load a different file than '~/.nodeenvrc'. "
        "Pass an empty string for no config (use built-in defaults).")

    parser.add_option(
        '-r', '--requirements',
        dest='requirements', default='', metavar='FILENAME',
        help='Install all the packages listed in the given requirements file.')

    parser.add_option(
        '--prompt', dest='prompt',
        help='Provides an alternative prompt prefix for this environment')

    parser.add_option(
        '-l', '--list', dest='list',
        action='store_true', default=False,
        help='Lists available node.js versions')

    parser.add_option(
        '--update', dest='update',
        action='store_true', default=False,
        help='Install npm packages from file without node')

    parser.add_option(
        '--without-ssl', dest='without_ssl',
        action='store_true', default=Config.without_ssl,
        help='Build node.js without SSL support')

    parser.add_option(
        '--debug', dest='debug',
        action='store_true', default=Config.debug,
        help='Build debug variant of the node.js')

    parser.add_option(
        '--profile', dest='profile',
        action='store_true', default=Config.profile,
        help='Enable profiling for node.js')

    parser.add_option(
        '--with-npm', dest='with_npm',
        action='store_true', default=Config.with_npm,
        help='Build without installing npm into the new virtual environment. '
        'Required for node.js < 0.6.3. By default, the npm included with '
        'node.js is used.')

    parser.add_option(
        '--npm', dest='npm',
        metavar='NPM_VER', default=Config.npm,
        help='The npm version to use, e.g., '
        '--npm=0.3.18 will use the npm-0.3.18.tgz '
        'tarball to install. '
        'The default is last available version (`latest`).')

    parser.add_option(
        '--no-npm-clean', dest='no_npm_clean',
        action='store_true', default=False,
        help='Skip the npm 0.x cleanup.  Cleanup is enabled by default.')

    parser.add_option(
        '--python-virtualenv', '-p', dest='python_virtualenv',
        action='store_true', default=False,
        help='Use current python virtualenv')

    parser.add_option(
        '--clean-src', '-c', dest='clean_src',
        action='store_true', default=False,
        help='Remove "src" directory after installation')

    parser.add_option(
        '--force', dest='force',
        action='store_true', default=False,
        help='Force installation in a pre-existing directory')

    parser.add_option(
        '--make', '-m', dest='make_path',
        metavar='MAKE_PATH',
        help='Path to make command',
        default=Config.make)

    parser.add_option(
        '--prebuilt', dest='prebuilt',
        action='store_true', default=Config.prebuilt,
        help='Install node.js from prebuilt package')

    options, args = parser.parse_args()
    if options.config_file is None:
        options.config_file = ["./setup.cfg", "~/.nodeenvrc"]
    elif not options.config_file:
        options.config_file = []
    else:
        # Make sure that explicitly provided files exist
        if not os.path.exists(options.config_file):
            parser.error("Config file '{0}' doesn't exist!".format(
                options.config_file))
        options.config_file = [options.config_file]

    if not check:
        return options, args

    if not options.list and not options.python_virtualenv:
        if not args:
            parser.error('You must provide a DEST_DIR or '
                         'use current python virtualenv')

        if len(args) > 1:
            parser.error('There must be only one argument: DEST_DIR '
                         '(you gave: {0})'.format(' '.join(args)))

    return options, args


def mkdir(path):
    """
    Create directory
    """
    if not os.path.exists(path):
        logger.debug(' * Creating: %s ... ', path, extra=dict(continued=True))
        os.makedirs(path)
        logger.debug('done.')
    else:
        logger.debug(' * Directory %s already exists', path)


def writefile(dest, content, overwrite=True, append=False):
    """
    Create file and write content in it
    """
    content = content.encode('utf-8')
    if not os.path.exists(dest):
        logger.debug(' * Writing %s ... ', dest, extra=dict(continued=True))
        with open(dest, 'wb') as f:
            f.write(content)
        logger.debug('done.')
        return
    else:
        with open(dest, 'rb') as f:
            c = f.read()
        if c == content:
            logger.debug(' * Content %s already in place', dest)
            return

        if not overwrite:
            logger.info(' * File %s exists with different content; '
                        ' not overwriting', dest)
            return

        if append:
            logger.info(' * Appending data to %s', dest)
            with open(dest, 'ab') as f:
                f.write(DISABLE_POMPT.encode('utf-8'))
                f.write(content)
                f.write(ENABLE_PROMPT.encode('utf-8'))
            return

        logger.info(' * Overwriting %s with new content', dest)
        with open(dest, 'wb') as f:
            f.write(content)


def callit(cmd, show_stdout=True, in_shell=False,
           cwd=None, extra_env=None):
    """
    Execute cmd line in sub-shell
    """
    all_output = []
    cmd_parts = []

    for part in cmd:
        if len(part) > 45:
            part = part[:20] + "..." + part[-20:]
        if ' ' in part or '\n' in part or '"' in part or "'" in part:
            part = '"%s"' % part.replace('"', '\\"')
        cmd_parts.append(part)
    cmd_desc = ' '.join(cmd_parts)
    logger.debug(" ** Running command %s" % cmd_desc)

    if in_shell:
        cmd = ' '.join(cmd)

    # output
    stdout = subprocess.PIPE

    # env
    if extra_env:
        env = os.environ.copy()
        if extra_env:
            env.update(extra_env)
    else:
        env = None

    # execute
    try:
        proc = subprocess.Popen(
            cmd, stderr=subprocess.STDOUT, stdin=None, stdout=stdout,
            cwd=cwd, env=env, shell=in_shell)
    except Exception:
        e = sys.exc_info()[1]
        logger.error("Error %s while executing command %s" % (e, cmd_desc))
        raise

    stdout = proc.stdout
    while stdout:
        line = stdout.readline()
        if not line:
            break
        line = line.decode('utf-8').rstrip()
        all_output.append(line)
        if show_stdout:
            logger.info(line)
    proc.wait()

    # error handler
    if proc.returncode:
        if show_stdout:
            for s in all_output:
                logger.critical(s)
        raise OSError("Command %s failed with error code %s"
                      % (cmd_desc, proc.returncode))

    return proc.returncode, all_output


def get_node_src_url(version, postfix=''):
    node_name = '%s-v%s%s' % (get_binary_prefix(), version, postfix)
    tar_name = '%s.tar.gz' % (node_name)
    if parse_version(version) > parse_version("0.5.0"):
        node_url = 'http://%s/dist/v%s/%s' % (src_domain, version, tar_name)
    else:
        node_url = 'http://%s/dist/%s' % (src_domain, tar_name)
    return node_url


@contextlib.contextmanager
def tarfile_open(*args, **kwargs):
    """Compatibility layer because py26."""
    tf = tarfile.open(*args, **kwargs)
    try:
        yield tf
    finally:
        tf.close()


def download_node(node_url, src_dir, env_dir, opt):
    """
    Download source code
    """
    tar_contents = io.BytesIO(urlopen(node_url).read())
    with tarfile_open(fileobj=tar_contents) as tarfile_obj:
        tarfile_obj.extractall(src_dir)
    logger.info(')', extra=dict(continued=True))


def get_node_src_url_postfix(opt):
    if not opt.prebuilt:
        return ''

    import platform
    postfix_system = platform.system().lower()
    arches = {'x86_64': 'x64', 'i686': 'x86'}
    postfix_arch = arches[platform.machine()]
    return '-{0}-{1}'.format(postfix_system, postfix_arch)

# ---------------------------------------------------------
# Virtual environment functions


def copy_node_from_prebuilt(env_dir, src_dir):
    """
    Copy prebuilt binaries into environment
    """
    logger.info('.', extra=dict(continued=True))
    prefix = get_binary_prefix()
    callit(['cp', '-a', src_dir + '/%s-v*/*' % prefix, env_dir], True, env_dir)
    logger.info('.', extra=dict(continued=True))


def build_node_from_src(env_dir, src_dir, node_src_dir, opt):
    env = {}
    make_param_names = ['load-average', 'jobs']
    make_param_values = map(
        lambda x: getattr(opt, x.replace('-', '_')),
        make_param_names)
    make_opts = [
        '--{0}={1}'.format(name, value)
        if len(value) > 0 else '--{0}'.format(name)
        for name, value in zip(make_param_names, make_param_values)
        if value is not None
    ]

    if getattr(sys.version_info, 'major', sys.version_info[0]) > 2:
        # Currently, the node.js build scripts are using python2.*,
        # therefore we need to temporarily point python exec to the
        # python 2.* version in this case.
        try:
            _, which_python2_output = callit(
                ['which', 'python2'], opt.verbose, True, node_src_dir, env
            )
            python2_path = which_python2_output[0]
        except (OSError, IndexError):
            raise OSError(
                'Python >=3.0 virtualenv detected, but no python2 '
                'command (required for building node.js) was found'
            )
        logger.debug(' * Temporarily pointing python to %s', python2_path)
        node_tmpbin_dir = join(src_dir, 'tmpbin')
        node_tmpbin_link = join(node_tmpbin_dir, 'python')
        mkdir(node_tmpbin_dir)
        if not os.path.exists(node_tmpbin_link):
            callit(['ln', '-s', python2_path, node_tmpbin_link])
        env['PATH'] = '{}:{}'.format(node_tmpbin_dir,
                                     os.environ.get('PATH', ''))

    conf_cmd = []
    conf_cmd.append('./configure')
    conf_cmd.append('--prefix=%s' % pipes.quote(env_dir))
    if opt.without_ssl:
        conf_cmd.append('--without-ssl')
    if opt.debug:
        conf_cmd.append('--debug')
    if opt.profile:
        conf_cmd.append('--profile')

    make_cmd = opt.make_path

    callit(conf_cmd, opt.verbose, True, node_src_dir, env)
    logger.info('.', extra=dict(continued=True))
    callit([make_cmd] + make_opts, opt.verbose, True, node_src_dir, env)
    logger.info('.', extra=dict(continued=True))
    callit([make_cmd + ' install'], opt.verbose, True, node_src_dir, env)


def get_binary_prefix():
    return 'node' if src_domain == 'nodejs.org' else 'iojs'


def install_node(env_dir, src_dir, opt):
    """
    Download source code for node.js, unpack it
    and install it in virtual environment.
    """
    prefix = get_binary_prefix()
    logger.info(' * Install %s (%s' % (prefix, opt.node),
                extra=dict(continued=True))

    node_url = get_node_src_url(opt.node, get_node_src_url_postfix(opt))
    node_src_dir = join(src_dir, '%s-v%s' % (prefix, opt.node))
    env_dir = abspath(env_dir)

    # get src if not downloaded yet
    if not os.path.exists(node_src_dir):
        download_node(node_url, src_dir, env_dir, opt)

    logger.info('.', extra=dict(continued=True))

    if opt.prebuilt:
        copy_node_from_prebuilt(env_dir, src_dir)
    else:
        build_node_from_src(env_dir, src_dir, node_src_dir, opt)

    logger.info(' done.')


def install_npm(env_dir, src_dir, opt):
    """
    Download source code for npm, unpack it
    and install it in virtual environment.
    """
    logger.info(' * Install npm.js (%s) ... ' % opt.npm,
                extra=dict(continued=True))
    npm_contents = urlopen('https://www.npmjs.org/install.sh').read()
    env = dict(
        os.environ,
        clean='no' if opt.no_npm_clean else 'yes',
        npm_install=opt.npm,
    )
    proc = subprocess.Popen(
        (
            'bash', '-c',
            '. {0} && exec bash'.format(
                pipes.quote(join(env_dir, 'bin', 'activate')),
            )
        ),
        env=env,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    out, _ = proc.communicate(npm_contents)
    if opt.verbose:
        logger.info(out)
    logger.info('done.')


def install_packages(env_dir, opt):
    """
    Install node.js packages via npm
    """
    logger.info(' * Install node.js packages ... ',
                extra=dict(continued=True))
    packages = [package.strip() for package in
                open(opt.requirements).readlines()]
    activate_path = join(env_dir, 'bin', 'activate')
    real_npm_ver = opt.npm if opt.npm.count(".") == 2 else opt.npm + ".0"
    if opt.npm == "latest" or real_npm_ver >= "1.0.0":
        cmd = '. ' + pipes.quote(activate_path) + \
              ' && npm install -g %(pack)s'
    else:
        cmd = '. ' + pipes.quote(activate_path) + \
              ' && npm install %(pack)s' + \
              ' && npm activate %(pack)s'

    for package in packages:
        callit(cmd=[
            cmd % {"pack": package}], show_stdout=opt.verbose, in_shell=True)

    logger.info('done.')


def install_activate(env_dir, opt):
    """
    Install virtual environment activation script
    """
    files = {'activate': ACTIVATE_SH, 'shim': SHIM}
    if opt.node == "system":
        files["node"] = SHIM
    bin_dir = join(env_dir, 'bin')
    mod_dir = join('lib', 'node_modules')
    prompt = opt.prompt or '(%s)' % os.path.basename(os.path.abspath(env_dir))
    mode_0755 = (stat.S_IRWXU | stat.S_IXGRP |
                 stat.S_IRGRP | stat.S_IROTH | stat.S_IXOTH)

    shim_node = join(bin_dir, "node")
    shim_nodejs = join(bin_dir, "nodejs")
    if opt.node == "system":
        env = os.environ.copy()
        env.update({'PATH': remove_env_bin_from_path(env['PATH'], bin_dir)})
        for candidate in ("nodejs", "node"):
            which_node_output, _ = subprocess.Popen(
                ["which", candidate],
                stdout=subprocess.PIPE, env=env).communicate()
            shim_node = clear_output(which_node_output)
            if shim_node:
                break
        assert shim_node, "Did not find nodejs or node system executable"

    for name, content in files.items():
        file_path = join(bin_dir, name)
        content = content.replace('__NODE_VIRTUAL_PROMPT__', prompt)
        content = content.replace('__NODE_VIRTUAL_ENV__',
                                  os.path.abspath(env_dir))
        content = content.replace('__SHIM_NODE__', shim_node)
        content = content.replace('__BIN_NAME__', os.path.basename(bin_dir))
        content = content.replace('__MOD_NAME__', mod_dir)
        # if we call in the same environment:
        #   $ nodeenv -p --prebuilt
        #   $ nodeenv -p --node=system
        # we should get `bin/node` not as binary+string.
        # `bin/activate` should be appended if we inside
        # existing python's virtual environment
        need_append = 0 if name in ('node', 'shim') else opt.python_virtualenv
        writefile(file_path, content, append=need_append)
        os.chmod(file_path, mode_0755)

    if not os.path.exists(shim_nodejs):
        os.symlink("node", shim_nodejs)


def create_environment(env_dir, opt):
    """
    Creates a new environment in ``env_dir``.
    """
    if os.path.exists(env_dir) and not opt.python_virtualenv:
        logger.info(' * Environment already exists: %s', env_dir)
        if not opt.force:
            sys.exit(2)
    src_dir = abspath(join(env_dir, 'src'))
    mkdir(src_dir)

    if opt.node != "system":
        install_node(env_dir, src_dir, opt)
    else:
        mkdir(join(env_dir, 'bin'))
        mkdir(join(env_dir, 'lib'))
        mkdir(join(env_dir, 'lib', 'node_modules'))
    # activate script install must be
    # before npm install, npm use activate
    # for install
    install_activate(env_dir, opt)
    if node_version_from_opt(opt) < parse_version("0.6.3") or opt.with_npm:
        install_npm(env_dir, src_dir, opt)
    if opt.requirements:
        install_packages(env_dir, opt)
    # Cleanup
    if opt.clean_src:
        callit(['rm -rf', pipes.quote(src_dir)], opt.verbose, True, env_dir)


class GetsAHrefs(HTMLParser):
    def __init__(self):
        # Old style class in py2 :(
        HTMLParser.__init__(self)
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.hrefs.append(dict(attrs).get('href', ''))

VERSION_RE = re.compile('\d+\.\d+\.\d+')


def _py2_cmp(a, b):
    # -1 = a < b, 0 = eq, 1 = a > b
    return (a > b) - (a < b)


def compare_versions(version, other_version):
    version_tuple = version.split('.')
    other_tuple = other_version.split('.')

    version_length = len(version_tuple)
    other_length = len(other_tuple)
    version_dots = min(version_length, other_length)

    for i in range(version_dots):
        a = int(version_tuple[i])
        b = int(other_tuple[i])
        cmp_value = _py2_cmp(a, b)
        if cmp_value != 0:
            return cmp_value

    return _py2_cmp(version_length, other_length)


def get_node_versions():
    response = urlopen('https://{0}/dist'.format(src_domain))
    href_parser = GetsAHrefs()
    href_parser.feed(response.read().decode('UTF-8'))

    versions = set(
        VERSION_RE.search(href).group()
        for href in href_parser.hrefs
        if VERSION_RE.search(href)
    )
    if is_PY3:
        key_compare = cmp_to_key(compare_versions)
        versions = sorted(versions, key=key_compare)
    else:
        versions = sorted(versions, cmp=compare_versions)
    return versions


def print_node_versions():
    """
    Prints into stdout all available node.js versions
    """
    versions = get_node_versions()
    chunks_of_8 = [
        versions[pos:pos + 8] for pos in range(0, len(versions), 8)
    ]
    for chunk in chunks_of_8:
        logger.info('\t'.join(chunk))


def get_last_stable_node_version():
    """
    Return last stable node.js version
    """
    response = urlopen('https://%s/dist/latest/' % (src_domain))
    href_parser = GetsAHrefs()
    href_parser.feed(response.read().decode('UTF-8'))

    links = []
    pattern = re.compile(r'''%s-v([0-9]+)\.([0-9]+)\.([0-9]+)\.tar\.gz''' % (
        get_binary_prefix()))

    for href in href_parser.hrefs:
        match = pattern.match(href)
        if match:
            version = u'.'.join(match.groups())
            major, minor, revision = map(int, match.groups())
            links.append((version, major, minor, revision))
            break

    return links[-1][0]


def get_env_dir(opt, args):
    if opt.python_virtualenv:
        if hasattr(sys, 'real_prefix'):
            return sys.prefix
        elif hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix:
            return sys.prefix
        logger.error('No python virtualenv is available')
        sys.exit(2)
    else:
        return args[0]


def is_installed(name):
    try:
        devnull = open(os.devnull)
        subprocess.Popen([name], stdout=devnull, stderr=devnull)
    except OSError as e:
        if e.errno == os.errno.ENOENT:
            return False
    return True


def main():
    """
    Entry point
    """
    # quick&dirty way to help update the README
    if "--dump-config-defaults" in sys.argv:
        Config._dump()
        return

    opt, args = parse_args(check=False)
    Config._load(opt.config_file, opt.verbose)

    opt, args = parse_args()

    if opt.io:
        global src_domain
        src_domain = "iojs.org"

    if not opt.node or opt.node.lower() == "latest":
        opt.node = get_last_stable_node_version()

    if opt.list:
        print_node_versions()
    elif opt.update:
        env_dir = get_env_dir(opt, args)
        install_packages(env_dir, opt)
    else:
        env_dir = get_env_dir(opt, args)
        create_environment(env_dir, opt)


# ---------------------------------------------------------
# Shell scripts content

DISABLE_POMPT = """
# disable nodeenv's prompt
# (prompt already changed by original virtualenv's script)
# https://github.com/ekalinin/nodeenv/issues/26
NODE_VIRTUAL_ENV_DISABLE_PROMPT=1
"""

ENABLE_PROMPT = """
unset NODE_VIRTUAL_ENV_DISABLE_PROMPT
"""

SHIM = """#!/usr/bin/env bash
export NODE_PATH=__NODE_VIRTUAL_ENV__/lib/node_modules
export NPM_CONFIG_PREFIX=__NODE_VIRTUAL_ENV__
export npm_config_prefix=__NODE_VIRTUAL_ENV__
exec __SHIM_NODE__ "$@"
"""

ACTIVATE_SH = """

# This file must be used with "source bin/activate" *from bash*
# you cannot run it directly

deactivate_node () {
    # reset old environment variables
    if [ -n "$_OLD_NODE_VIRTUAL_PATH" ] ; then
        PATH="$_OLD_NODE_VIRTUAL_PATH"
        export PATH
        unset _OLD_NODE_VIRTUAL_PATH

        NODE_PATH="$_OLD_NODE_PATH"
        export NODE_PATH
        unset _OLD_NODE_PATH

        NPM_CONFIG_PREFIX="$_OLD_NPM_CONFIG_PREFIX"
        npm_config_prefix="$_OLD_npm_config_prefix"
        export NPM_CONFIG_PREFIX
        export npm_config_prefix
        unset _OLD_NPM_CONFIG_PREFIX
        unset _OLD_npm_config_prefix
    fi

    # This should detect bash and zsh, which have a hash command that must
    # be called to get it to forget past commands.  Without forgetting
    # past commands the $PATH changes we made may not be respected
    if [ -n "$BASH" -o -n "$ZSH_VERSION" ] ; then
        hash -r
    fi

    if [ -n "$_OLD_NODE_VIRTUAL_PS1" ] ; then
        PS1="$_OLD_NODE_VIRTUAL_PS1"
        export PS1
        unset _OLD_NODE_VIRTUAL_PS1
    fi

    unset NODE_VIRTUAL_ENV
    if [ ! "$1" = "nondestructive" ] ; then
    # Self destruct!
        unset -f deactivate_node
    fi
}

freeze () {
    local NPM_VER=`npm -v | cut -d '.' -f 1`
    local re="[a-zA-Z0-9\.\-]+@[0-9]+\.[0-9]+\.[0-9]+([\+\-][a-zA-Z0-9\.\-]+)*"
    if [ "$NPM_VER" != '1' ]; then
        NPM_LIST=`npm list installed active 2>/dev/null | \
                  cut -d ' ' -f 1 | grep -v npm`
    else
        local npmls="npm ls -g"
        if [ "$1" = "-l" ]; then
            npmls="npm ls"
            shift
        fi
        NPM_LIST=$(eval ${npmls} | grep -E '^.{4}\w{1}'| \
                                   grep -o -E "$re"| grep -v npm)
    fi

    if [ -z "$@" ]; then
        echo "$NPM_LIST"
    else
        echo "$NPM_LIST" > $@
    fi
}

# unset irrelavent variables
deactivate_node nondestructive

# find the directory of this script
# http://stackoverflow.com/a/246128
if [ "${BASH_SOURCE}" ] ; then
    SOURCE="${BASH_SOURCE[0]}"

    while [ -h "$SOURCE" ] ; do SOURCE="$(readlink "$SOURCE")"; done
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

    NODE_VIRTUAL_ENV="$(dirname "$DIR")"
else
    # dash not movable. fix use case:
    #   dash -c " . node-env/bin/activate && node -v"
    NODE_VIRTUAL_ENV="__NODE_VIRTUAL_ENV__"
fi

# NODE_VIRTUAL_ENV is the parent of the directory where this script is
export NODE_VIRTUAL_ENV

_OLD_NODE_VIRTUAL_PATH="$PATH"
PATH="$NODE_VIRTUAL_ENV/__BIN_NAME__:$PATH"
export PATH

_OLD_NODE_PATH="$NODE_PATH"
NODE_PATH="$NODE_VIRTUAL_ENV/__MOD_NAME__"
export NODE_PATH

_OLD_NPM_CONFIG_PREFIX="$NPM_CONFIG_PREFIX"
_OLD_npm_config_prefix="$npm_config_prefix"
NPM_CONFIG_PREFIX="$NODE_VIRTUAL_ENV"
npm_config_prefix="$NODE_VIRTUAL_ENV"
export NPM_CONFIG_PREFIX
export npm_config_prefix

if [ -z "$NODE_VIRTUAL_ENV_DISABLE_PROMPT" ] ; then
    _OLD_NODE_VIRTUAL_PS1="$PS1"
    if [ "x__NODE_VIRTUAL_PROMPT__" != x ] ; then
        PS1="__NODE_VIRTUAL_PROMPT__$PS1"
    else
    if [ "`basename \"$NODE_VIRTUAL_ENV\"`" = "__" ] ; then
        # special case for Aspen magic directories
        # see http://www.zetadev.com/software/aspen/
        PS1="[`basename \`dirname \"$NODE_VIRTUAL_ENV\"\``] $PS1"
    else
        PS1="(`basename \"$NODE_VIRTUAL_ENV\"`)$PS1"
    fi
    fi
    export PS1
fi

# This should detect bash and zsh, which have a hash command that must
# be called to get it to forget past commands.  Without forgetting
# past commands the $PATH changes we made may not be respected
if [ -n "$BASH" -o -n "$ZSH_VERSION" ] ; then
    hash -r
fi
"""

if __name__ == '__main__':
    main()
