"""Deterministic contract tests: no command, remote action or privilege escalation."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hamasaki_pipeline as p

META = {
    "github": p.EXTENSIONS["github"],
    "kde": p.EXTENSIONS["kde"],
    "sh": {"keywords": ["shell", "bash"], "extensions": [], "weight": 1.0},
    "package": p.EXTENSIONS["package"],
    "python": p.EXTENSIONS["python"],
}

class TestHamasakiPlanning(unittest.TestCase):
    def setUp(self):
        self.calls = []
        def probe(name):
            self.calls.append(name)
            return {"state": "NATIVE", "binary": "/mock/" + name, "evidence": "test_only"}
        self.env = p.EnvSnapshot(probe=probe)

    def plan(self, query, *, tier="auto", tools=META):
        return p.plan(query, tools=tools, tier=tier, snapshot=self.env)

    def test_github_route_probes_only_selected(self):
        r = self.plan("github repository status")
        self.assertEqual(r["status"], "PLAN_ONLY")
        self.assertEqual(r["selected_tool"], "github")
        self.assertEqual(self.calls, ["gh"])
        self.assertFalse(r["executed"])

    def test_cache_reuses_same_runtime_in_one_process(self):
        self.plan("github repository status")
        self.plan("github repository status")
        self.assertEqual(self.calls, ["gh"])
        self.assertEqual(self.env.hits, 1)

    def test_unmatched_intent_is_refused(self):
        r = self.plan("abracadabra nothing relevant")
        self.assertEqual(r["error_code"], "ERR_NO_MATCH")
        self.assertEqual(self.calls, [])

    def test_read_only_blocks_mutation_without_probe(self):
        r = self.plan("github push", tier="read-only")
        self.assertEqual(r["error_code"], "ERR_PERMISSION_DENIED")
        self.assertEqual(self.calls, [])

    def test_unknown_tier_fails_closed(self):
        r = self.plan("github repository status", tier="unknown")
        self.assertEqual(r["error_code"], "ERR_POLICY_UNKNOWN")

    def test_prereq_failure_no_shell_fallback(self):
        self.env = p.EnvSnapshot(probe=lambda name: {"state": "UNAVAILABLE", "binary": None})
        r = self.plan("github repository status")
        self.assertEqual(r["error_code"], "ERR_PREREQUISITE_UNVERIFIED")
        self.assertNotIn("selected_tool", r)
        self.assertNotIn("sh", r["trace_receipt"]["stages"])

    def test_shell_request_still_only_plans(self):
        r = self.plan("bash shell help")
        self.assertEqual(r["selected_tool"], "sh")
        self.assertFalse(r["executed"])

    def test_package_manager_never_writes(self):
        r = self.plan("apt install software")
        self.assertEqual(r["error_code"], "ERR_PREREQUISITE_UNVERIFIED")
        self.assertFalse(r["executed"])
        self.assertEqual(self.calls, [])

    def test_kde_chooser(self):
        r = self.plan("KDE Dolphin file manager")
        self.assertEqual(r["selected_tool"], "kde")
        self.assertEqual(self.calls, ["dolphin"])

    def test_explicit_tool_override(self):
        r = self.plan("github status")
        self.assertEqual(r["selected_tool"], "github")
        self.assertGreater(r["score"], 60)

    def test_empty_catalog_refuses(self):
        r = self.plan("github status", tools={})
        self.assertEqual(r["error_code"], "ERR_CATALOG_UNAVAILABLE")

    def test_cache_expiry(self):
        times = [0.0]
        env = p.EnvSnapshot(probe=lambda n: {"state": "NATIVE"}, ttl=10,
                            clock=lambda: times[0])
        env.get("gh")
        env.get("gh")
        self.assertEqual((env.probes, env.hits), (1, 1))
        times[0] = 11.0
        env.get("gh")
        self.assertEqual(env.probes, 2)

if __name__ == "__main__":
    unittest.main()
