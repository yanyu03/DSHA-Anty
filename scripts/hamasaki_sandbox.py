"""Minimal offline Bubblewrap mount profile; no host root bind, no secrets."""
from pathlib import Path
import sys

def arguments(bwrap,snapshot,entry,argv,python_bin=None):
    if not snapshot.is_dir() or snapshot.is_symlink():
        raise ValueError("ERR_UNSAFE_SNAPSHOT")
    if not isinstance(entry,str) or not entry.endswith(".py") or Path(entry).name!=entry or entry.startswith("."):
        raise ValueError("ERR_UNSAFE_ENTRY")
    py=Path(python_bin or sys.executable).resolve()
    if not (py.is_relative_to(Path("/usr")) or py.is_relative_to(Path("/bin"))):
        raise ValueError("ERR_NONSTANDARD_PYTHON_INTERPRETER")
    args=[bwrap,"--die-with-parent","--new-session","--unshare-user","--unshare-pid",
          "--unshare-net","--unshare-ipc","--unshare-uts","--clearenv"]
    for p in ("/usr","/bin","/lib","/lib64"):
        if Path(p).exists():
            args+=["--ro-bind",p,p]
    args+=["--proc","/proc","--dev","/dev","--tmpfs","/tmp","--dir","/home","--dir","/root",
           "--ro-bind",str(snapshot),"/tool",
           "--setenv","HOME","/nonexistent","--setenv","PATH","/usr/bin:/bin",
           "--setenv","LANG","C.UTF-8","--setenv","PYTHONDONTWRITEBYTECODE","1",
           "--chdir","/tool","--",str(py),"-I","-B","/tool/"+entry]
    return args+list(argv)

def safe_environment():
    return {"PATH":"/usr/bin:/bin","HOME":"/nonexistent",
            "LANG":"C.UTF-8","PYTHONDONTWRITEBYTECODE":"1"}
