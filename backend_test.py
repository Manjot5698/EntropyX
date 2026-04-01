#!/usr/bin/env python3
"""
EntropyX Backend API Testing Suite
Tests all core functionality including session management, validator operations, 
entropy selection, simulation, and fairness analytics.
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class EntropyXAPITester:
    def __init__(self, base_url="https://fairness-engine.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params, timeout=30)
            else:
                return False, {}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, data, status = self.make_request('GET', '')
        self.log_test("Root endpoint (/api/)", success and status == 200, 
                     f"Status: {status}, Response: {data}")
        
        # Test health endpoint
        success, data, status = self.make_request('GET', 'health')
        self.log_test("Health endpoint (/api/health)", success and status == 200,
                     f"Status: {status}, Response: {data}")

    def test_session_creation(self):
        """Test session creation"""
        print("\n🔍 Testing Session Management...")
        
        success, data, status = self.make_request('POST', 'session/create')
        
        if success and status == 200 and 'session_id' in data:
            self.session_id = data['session_id']
            self.log_test("Create session", True, f"Session ID: {self.session_id}")
            return True
        else:
            self.log_test("Create session", False, f"Status: {status}, Response: {data}")
            return False

    def test_validators_endpoints(self):
        """Test validator management endpoints"""
        if not self.session_id:
            self.log_test("Validators test", False, "No session ID available")
            return
        
        print("\n🔍 Testing Validator Management...")
        
        # Get initial validators
        success, data, status = self.make_request('GET', 'validators', params={'session_id': self.session_id})
        initial_validators = data if success else []
        self.log_test("Get validators", success and status == 200 and isinstance(data, list),
                     f"Status: {status}, Count: {len(initial_validators) if isinstance(data, list) else 0}")
        
        if not success:
            return
        
        # Add a new validator
        new_validator_data = {
            "validator_name": "Test-Validator-Zeta",
            "weight": 1.5
        }
        success, data, status = self.make_request('POST', 'validators/add', 
                                                 data=new_validator_data, 
                                                 params={'session_id': self.session_id})
        
        added_validator = None
        if success and status == 200 and 'validator_id' in data:
            added_validator = data
            self.log_test("Add validator", True, f"Added: {data['validator_name']}")
        else:
            self.log_test("Add validator", False, f"Status: {status}, Response: {data}")
        
        # Update validator status
        if added_validator:
            update_data = {"status": "inactive"}
            success, data, status = self.make_request('PATCH', f"validators/{added_validator['validator_id']}", 
                                                     data=update_data, 
                                                     params={'session_id': self.session_id})
            self.log_test("Update validator status", success and status == 200,
                         f"Status: {status}, Response: {data}")
        
        # Remove the test validator
        if added_validator:
            success, data, status = self.make_request('DELETE', f"validators/remove/{added_validator['validator_id']}", 
                                                     params={'session_id': self.session_id})
            self.log_test("Remove validator", success and status == 200,
                         f"Status: {status}, Response: {data}")

    def test_entropy_selection(self):
        """Test validator selection using entropy"""
        if not self.session_id:
            self.log_test("Entropy selection test", False, "No session ID available")
            return
        
        print("\n🔍 Testing Entropy-Based Selection...")
        
        # Single validator selection
        success, data, status = self.make_request('POST', 'select-validator', 
                                                 params={'session_id': self.session_id})
        
        if success and status == 200 and 'validator_name' in data and 'entropy_hash' in data:
            self.log_test("Select validator", True, 
                         f"Selected: {data['validator_name']}, Confidence: {data.get('entropy_confidence', 'N/A')}%")
        else:
            self.log_test("Select validator", False, f"Status: {status}, Response: {data}")

    def test_simulation(self):
        """Test batch simulation"""
        if not self.session_id:
            self.log_test("Simulation test", False, "No session ID available")
            return
        
        print("\n🔍 Testing Batch Simulation...")
        
        # Run a small simulation (10 rounds for testing)
        success, data, status = self.make_request('POST', 'simulate-rounds', 
                                                 params={'session_id': self.session_id, 'rounds': 10})
        
        if success and status == 200 and 'rounds_completed' in data and 'results' in data:
            rounds_completed = data['rounds_completed']
            results = data['results']
            self.log_test("Simulate rounds", True, 
                         f"Completed: {rounds_completed} rounds, Results count: {len(results)}")
        else:
            self.log_test("Simulate rounds", False, f"Status: {status}, Response: {data}")

    def test_analytics_endpoints(self):
        """Test analytics and reporting endpoints"""
        if not self.session_id:
            self.log_test("Analytics test", False, "No session ID available")
            return
        
        print("\n🔍 Testing Analytics & Reporting...")
        
        # Get selection history
        success, data, status = self.make_request('GET', 'selection-history', 
                                                 params={'session_id': self.session_id, 'limit': 50})
        
        if success and status == 200 and 'selections' in data and 'total' in data:
            selections = data['selections']
            total = data['total']
            self.log_test("Get selection history", True, 
                         f"Retrieved: {len(selections)} selections, Total: {total}")
        else:
            self.log_test("Get selection history", False, f"Status: {status}, Response: {data}")
        
        # Get fairness report
        success, data, status = self.make_request('GET', 'fairness-report', 
                                                 params={'session_id': self.session_id})
        
        if success and status == 200 and 'total_rounds' in data and 'validators' in data:
            total_rounds = data['total_rounds']
            validators = data['validators']
            fairness_pct = data.get('fairness_percentage', 0)
            decentralization = data.get('decentralization_score', 0)
            self.log_test("Get fairness report", True, 
                         f"Rounds: {total_rounds}, Validators: {len(validators)}, Fairness: {fairness_pct}%")
        else:
            self.log_test("Get fairness report", False, f"Status: {status}, Response: {data}")
        
        # Get entropy status
        success, data, status = self.make_request('GET', 'entropy-status')
        
        if success and status == 200 and 'pool_hash' in data and 'pool_health' in data:
            pool_health = data['pool_health']
            freshness = data.get('freshness', 0)
            self.log_test("Get entropy status", True, 
                         f"Pool Health: {pool_health}%, Freshness: {freshness}%")
        else:
            self.log_test("Get entropy status", False, f"Status: {status}, Response: {data}")

    def test_session_cleanup(self):
        """Test session cleanup functionality"""
        if not self.session_id:
            self.log_test("Session cleanup test", False, "No session ID available")
            return
        
        print("\n🔍 Testing Session Cleanup...")
        
        # Clear session history
        success, data, status = self.make_request('DELETE', f'session/{self.session_id}/clear-history')
        
        if success and status == 200:
            self.log_test("Clear session history", True, "History cleared successfully")
        else:
            self.log_test("Clear session history", False, f"Status: {status}, Response: {data}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting EntropyX Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run tests in sequence
        self.test_health_check()
        
        if self.test_session_creation():
            self.test_validators_endpoints()
            self.test_entropy_selection()
            self.test_simulation()
            self.test_analytics_endpoints()
            self.test_session_cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    """Main test runner"""
    tester = EntropyXAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())