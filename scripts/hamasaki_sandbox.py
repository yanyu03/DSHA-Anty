"""Constrained, offline Bubblewrap launcher arguments for untrusted Tools.

All external executables must be root-owned system binaries. Never mount the
host root or user home; the current workspace is not a sandbox mount.
"""
from pathlib import Path
import os
import shutil
import stat
import sys

def trusted_runtime(name):
    """Only accept non-writable root-owned executables in standard system roots."""
    path=shutil.which(name)
    if not path:
        return None
    try:
        p=Path(path).resolve(strict=True)
        st=p.stat()
        if (not p.is_relative_to(Path("/usr")) and
            not p.is_relative_to(Path("/bin"))):
            return None
        if not stat.S_ISREG(st.st_mode) or st.st_uid != 0 or st.st_mode & 0o022:
            return None
        if not st.st_mode & 0o111:
            return None
        return str(p)
    except (OSError,RuntimeError):
        return None

def arguments(bwrap,snapshot,entry,argv,python_bin=None):
    if not snapshot.is_dir() or snapshot.is_symlink():
        raise ValueError("ERR_UNSAFE_SNAPSHOT")
    if not isinstance(entry,str) or not entry.endswith(".py") or Path(entry).name!=entry or entry.startswith("."):
        raise ValueError("ERR_UNSAFE_ENTRY")
    py=Path(python_bin or sys.executable).resolve()
    if not (py.is_relative_to(Path("/usr")) or py.is_relative_to(Path("/bin"))):
        raise ValueError("ERR_NONSTANDARD_PYTHON_INTERPRETER")
    args=[bwrap,"--die-with-parent","--unshare-user","--unshare-pid",
          "--unshare-net","--unshare-ipc","--unshare-uts","--clearenv"]
    # Explicit system binaries/libraries only. Never --ro-bind the host '/'.
    for root in ("/usr","/bin","/lib","/lib64"):
        p=Path(root)
        if p.is_symlink():
            args+=["--symlink",os.readlink(root),root]
        elif p.is_dir():
            args+=["--ro-bind",root,root]
    args+=["--proc","/proc","--dev","/dev","--tmpfs","/tmp",
           "--dir","/home","--dir","/root",
           "--ro-bind",str(snapshot),"/tool",
           "--setenv","HOME","/nonexistent","--setenv","PATH","/usr/bin:/bin",
           "--setenv","LANG","C.UTF-8","--setenv","PYTHONDONTWRITEBYTECODE","1",
           "--chdir","/tool","--",str(py),"-I","-B","/tool/"+entry]
    return args+list(argv)

def safe_environment():
    return {"PATH":"/usr/bin:/bin","HOME":"/nonexistent",
            "LANG":"C.UTF-8","PYTHONDONTWRITEBYTECODE":"1"}
