import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import demo_tools


class DemoToolsTest(unittest.TestCase):
    def test_investigation_evidence_has_the_standard_envelope(self):
        for result in (
            demo_tools.query_database("sales"),
            demo_tools.detect_anomaly("sales"),
            demo_tools.analyze_logs("inventory_etl"),
            demo_tools.calculate_impact("INC-001"),
        ):
            self.assertEqual(result["status"], "success")
            self.assertIn("data", result)
            self.assertTrue(result["metadata"]["tool"])
            self.assertTrue(result["metadata"]["execution_id"].startswith("EXEC-"))

    def test_recovery_requires_approval(self):
        result = demo_tools.execute_recovery("INC-001", "")
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["error"]["code"], "APPROVAL_INVALID")

    def test_verified_result_requires_the_expected_action(self):
        result = demo_tools.verify_result("INC-001", "ACT-001")
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["data"]["verified"])


if __name__ == "__main__":
    unittest.main()
