#!/usr/bin/env python3
"""
Backend API Regression Test Suite for VSH MLA Portal
Comprehensive backend testing after visual redesign
"""

import requests
import json
import sys
import time

# Base URL from environment
BASE_URL = "https://vithal-somanna.preview.emergentagent.com/api"
FRONTEND_URL = "https://vithal-somanna.preview.emergentagent.com"

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def print_test(name, passed, details=""):
    """Print test result and track statistics"""
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    
    test_results.append({
        "name": name,
        "passed": passed,
        "details": details
    })
    
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1
    
    return passed

def test_settings_endpoint():
    """Test GET /api/settings - verify stats are nonzero"""
    print("\n" + "="*80)
    print("TEST: Settings Endpoint")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/settings", timeout=10)
        
        if response.status_code != 200:
            print_test("GET /api/settings", False, f"Status: {response.status_code}")
            return False
        
        data = response.json()
        
        # Check for stats array
        if "stats" not in data:
            print_test("GET /api/settings has stats", False, "stats field missing")
            return False
        
        stats = data["stats"]
        if not isinstance(stats, list) or len(stats) == 0:
            print_test("GET /api/settings stats array", False, f"stats is not a valid array: {stats}")
            return False
        
        # Check that stats have nonzero values
        nonzero_count = 0
        for stat in stats:
            if "value" in stat and stat["value"] != 0:
                nonzero_count += 1
        
        print_test("GET /api/settings", True, f"Stats array has {len(stats)} items, {nonzero_count} with nonzero values")
        
        if nonzero_count > 0:
            print_test("GET /api/settings stats nonzero", True, f"{nonzero_count}/{len(stats)} stats have nonzero values")
        else:
            print_test("GET /api/settings stats nonzero", False, "All stats are zero")
            return False
        
        return True
        
    except Exception as e:
        print_test("GET /api/settings", False, f"Error: {str(e)}")
        return False

def test_stats_endpoint():
    """Test GET /api/stats"""
    print("\n" + "="*80)
    print("TEST: Stats Endpoint")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        
        if response.status_code != 200:
            print_test("GET /api/stats", False, f"Status: {response.status_code}")
            return False
        
        data = response.json()
        
        # Check for expected fields
        expected_fields = ["projects", "news", "events", "gallery", "documents", "villages"]
        missing_fields = [f for f in expected_fields if f not in data]
        
        if missing_fields:
            print_test("GET /api/stats fields", False, f"Missing fields: {missing_fields}")
            return False
        
        # Show counts
        counts_str = ", ".join([f"{k}={data[k]}" for k in expected_fields])
        print_test("GET /api/stats", True, f"All fields present: {counts_str}")
        
        return True
        
    except Exception as e:
        print_test("GET /api/stats", False, f"Error: {str(e)}")
        return False

def test_list_endpoints():
    """Test all list endpoints"""
    print("\n" + "="*80)
    print("TEST: List Endpoints")
    print("="*80)
    
    endpoints = ["projects", "news", "events", "schemes", "gallery", "documents", "villages"]
    all_passed = True
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}/{endpoint}", timeout=10)
            
            if response.status_code != 200:
                print_test(f"GET /api/{endpoint}", False, f"Status: {response.status_code}")
                all_passed = False
                continue
            
            data = response.json()
            
            if not isinstance(data, list):
                print_test(f"GET /api/{endpoint}", False, f"Response is not an array")
                all_passed = False
                continue
            
            print_test(f"GET /api/{endpoint}", True, f"Returns {len(data)} items")
            
        except Exception as e:
            print_test(f"GET /api/{endpoint}", False, f"Error: {str(e)}")
            all_passed = False
    
    return all_passed

def test_project_filters_and_details():
    """Test project filters and detail endpoint"""
    print("\n" + "="*80)
    print("TEST: Project Filters and Details")
    print("="*80)
    
    all_passed = True
    
    try:
        # Test featured filter
        response = requests.get(f"{BASE_URL}/projects?featured=true", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_test("GET /api/projects?featured=true", True, f"Returns {len(data)} featured projects")
        else:
            print_test("GET /api/projects?featured=true", False, f"Status: {response.status_code}")
            all_passed = False
        
        # Test status filter
        response = requests.get(f"{BASE_URL}/projects?status=Ongoing", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_test("GET /api/projects?status=Ongoing", True, f"Returns {len(data)} ongoing projects")
        else:
            print_test("GET /api/projects?status=Ongoing", False, f"Status: {response.status_code}")
            all_passed = False
        
        # Get a project ID for detail test
        response = requests.get(f"{BASE_URL}/projects", timeout=10)
        if response.status_code == 200:
            projects = response.json()
            if len(projects) > 0:
                project_id = projects[0].get("id")
                
                # Test project detail
                response = requests.get(f"{BASE_URL}/projects/{project_id}", timeout=10)
                if response.status_code == 200:
                    project = response.json()
                    print_test(f"GET /api/projects/{project_id}", True, f"Returns project: {project.get('name', 'N/A')[:50]}")
                else:
                    print_test(f"GET /api/projects/{project_id}", False, f"Status: {response.status_code}")
                    all_passed = False
            else:
                print_test("GET /api/projects/{id}", False, "No projects available for detail test")
                all_passed = False
        
    except Exception as e:
        print_test("Project filters/details", False, f"Error: {str(e)}")
        all_passed = False
    
    return all_passed

def test_news_details():
    """Test news detail endpoint"""
    print("\n" + "="*80)
    print("TEST: News Details")
    print("="*80)
    
    try:
        # Get a news ID
        response = requests.get(f"{BASE_URL}/news", timeout=10)
        if response.status_code != 200:
            print_test("GET /api/news", False, f"Status: {response.status_code}")
            return False
        
        news_list = response.json()
        if len(news_list) == 0:
            print_test("GET /api/news/{id}", False, "No news items available for detail test")
            return False
        
        news_id = news_list[0].get("id")
        
        # Test news detail
        response = requests.get(f"{BASE_URL}/news/{news_id}", timeout=10)
        if response.status_code == 200:
            news = response.json()
            print_test(f"GET /api/news/{news_id}", True, f"Returns news: {news.get('title', 'N/A')[:50]}")
            return True
        else:
            print_test(f"GET /api/news/{news_id}", False, f"Status: {response.status_code}")
            return False
        
    except Exception as e:
        print_test("News details", False, f"Error: {str(e)}")
        return False

def test_admin_auth():
    """Test admin authentication and protected routes"""
    print("\n" + "="*80)
    print("TEST: Admin Authentication")
    print("="*80)
    
    all_passed = True
    admin_token = None
    
    try:
        # Test admin login with correct credentials
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@vsh.gov.in", "password": "Admin@12345"},
            timeout=10
        )
        
        if response.status_code != 200:
            print_test("Admin login", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
        
        data = response.json()
        if "token" not in data:
            print_test("Admin login", False, "No token in response")
            return False
        
        admin_token = data["token"]
        print_test("Admin login", True, f"Token received, user: {data.get('user', {}).get('email', 'N/A')}")
        
        # Test /api/auth/me with token
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            user = response.json()
            print_test("GET /api/auth/me (authenticated)", True, f"User: {user.get('email', 'N/A')}, Role: {user.get('role', 'N/A')}")
        else:
            print_test("GET /api/auth/me (authenticated)", False, f"Status: {response.status_code}")
            all_passed = False
        
        # Test /api/auth/me without token (should fail)
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if response.status_code == 401:
            print_test("GET /api/auth/me (unauthenticated)", True, "Correctly returns 401")
        else:
            print_test("GET /api/auth/me (unauthenticated)", False, f"Expected 401, got {response.status_code}")
            all_passed = False
        
        # Test protected /api/admin/stats with token
        response = requests.get(
            f"{BASE_URL}/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            stats = response.json()
            print_test("GET /api/admin/stats (authenticated)", True, f"Stats received")
        else:
            print_test("GET /api/admin/stats (authenticated)", False, f"Status: {response.status_code}")
            all_passed = False
        
        # Test protected /api/admin/stats without token (should fail)
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=10)
        
        if response.status_code == 401:
            print_test("GET /api/admin/stats (unauthenticated)", True, "Correctly returns 401")
        else:
            print_test("GET /api/admin/stats (unauthenticated)", False, f"Expected 401, got {response.status_code}")
            all_passed = False
        
        return all_passed and admin_token is not None, admin_token
        
    except Exception as e:
        print_test("Admin authentication", False, f"Error: {str(e)}")
        return False, None

def test_news_schemes_crud(admin_token):
    """Test News and Schemes CRUD with multilingual fields"""
    print("\n" + "="*80)
    print("TEST: News and Schemes CRUD (Multilingual)")
    print("="*80)
    
    all_passed = True
    news_id = None
    scheme_id = None
    
    try:
        # Create NEWS with multilingual fields
        news_data = {
            "title": "TEST Water Project Announcement",
            "title_kn": "ಪರೀಕ್ಷೆ ನೀರಿನ ಯೋಜನೆ ಪ್ರಕಟಣೆ",
            "title_hi": "परीक्षण जल परियोजना घोषणा",
            "category": "Announcement",
            "excerpt": "TEST English excerpt for water project",
            "excerpt_kn": "ಪರೀಕ್ಷೆ ಕನ್ನಡ ಸಾರಾಂಶ",
            "excerpt_hi": "परीक्षण हिंदी सारांश",
            "content": "TEST English content about water infrastructure",
            "content_kn": "ಪರೀಕ್ಷೆ ಕನ್ನಡ ವಿಷಯ",
            "content_hi": "परीक्षण हिंदी सामग्री",
            "author": "TEST Office"
        }
        
        response = requests.post(
            f"{BASE_URL}/admin/news",
            json=news_data,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            news_id = result.get("id")
            
            # Verify multilingual fields
            missing_fields = []
            for field in ["title_kn", "title_hi", "excerpt_kn", "excerpt_hi", "content_kn", "content_hi"]:
                if field not in result:
                    missing_fields.append(field)
            
            if not missing_fields and news_id:
                print_test("POST /api/admin/news (multilingual)", True, f"Created news ID: {news_id}, all EN/KN/HI fields present")
            else:
                print_test("POST /api/admin/news (multilingual)", False, f"Missing fields: {missing_fields}")
                all_passed = False
        else:
            print_test("POST /api/admin/news", False, f"Status: {response.status_code}, Response: {response.text}")
            all_passed = False
        
        # Create SCHEME with multilingual fields
        scheme_data = {
            "name": "TEST Housing Assistance Scheme",
            "name_kn": "ಪರೀಕ್ಷೆ ವಸತಿ ಸಹಾಯ ಯೋಜನೆ",
            "name_hi": "परीक्षण आवास सहायता योजना",
            "scope": "State Government",
            "department": "Housing",
            "description": "TEST English description for housing",
            "description_kn": "ಪರೀಕ್ಷೆ ಕನ್ನಡ ವಿವರಣೆ",
            "description_hi": "परीक्षण हिंदी विवरण",
            "eligibility": "TEST English eligibility criteria",
            "eligibility_kn": "ಪರೀಕ್ಷೆ ಅರ್ಹತೆ",
            "eligibility_hi": "परीक्षण पात्रता"
        }
        
        response = requests.post(
            f"{BASE_URL}/admin/schemes",
            json=scheme_data,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            scheme_id = result.get("id")
            
            # Verify multilingual fields
            missing_fields = []
            for field in ["name_kn", "name_hi", "description_kn", "description_hi", "eligibility_kn", "eligibility_hi"]:
                if field not in result:
                    missing_fields.append(field)
            
            if not missing_fields and scheme_id:
                print_test("POST /api/admin/schemes (multilingual)", True, f"Created scheme ID: {scheme_id}, all EN/KN/HI fields present")
            else:
                print_test("POST /api/admin/schemes (multilingual)", False, f"Missing fields: {missing_fields}")
                all_passed = False
        else:
            print_test("POST /api/admin/schemes", False, f"Status: {response.status_code}, Response: {response.text}")
            all_passed = False
        
        # Cleanup - Delete NEWS
        if news_id:
            response = requests.delete(
                f"{BASE_URL}/admin/news/{news_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                print_test("DELETE /api/admin/news/{id}", True, f"Deleted news ID: {news_id}")
            else:
                print_test("DELETE /api/admin/news/{id}", False, f"Status: {response.status_code}")
                all_passed = False
        
        # Cleanup - Delete SCHEME
        if scheme_id:
            response = requests.delete(
                f"{BASE_URL}/admin/schemes/{scheme_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                print_test("DELETE /api/admin/schemes/{id}", True, f"Deleted scheme ID: {scheme_id}")
            else:
                print_test("DELETE /api/admin/schemes/{id}", False, f"Status: {response.status_code}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_test("News/Schemes CRUD", False, f"Error: {str(e)}")
        return False

def test_citizen_auth_and_requests():
    """Test citizen registration, login, and requests"""
    print("\n" + "="*80)
    print("TEST: Citizen Authentication and Requests")
    print("="*80)
    
    all_passed = True
    citizen_token = None
    citizen_email = f"test_citizen_{int(time.time())}@example.com"
    citizen_mobile = f"98765{int(time.time()) % 100000:05d}"
    citizen_password = "TestPass123"
    
    try:
        # Test citizen registration
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "TEST Citizen User",
                "email": citizen_email,
                "mobile": citizen_mobile,
                "password": citizen_password
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and data.get("user", {}).get("role") == "Citizen":
                citizen_token = data["token"]
                print_test("POST /api/auth/register (citizen)", True, f"Created citizen: {citizen_email}")
                
                # Save credentials to memory
                try:
                    with open("/app/memory/test_credentials.md", "a") as f:
                        f.write(f"\n## TEST Citizen (created during regression test)\n")
                        f.write(f"- Email: `{citizen_email}`\n")
                        f.write(f"- Mobile: `{citizen_mobile}`\n")
                        f.write(f"- Password: `{citizen_password}`\n")
                        f.write(f"- Role: Citizen\n")
                        f.write(f"- Created: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                except Exception as e:
                    print(f"   Warning: Could not save credentials to memory: {e}")
            else:
                print_test("POST /api/auth/register (citizen)", False, f"Invalid response: {data}")
                all_passed = False
        else:
            print_test("POST /api/auth/register (citizen)", False, f"Status: {response.status_code}, Response: {response.text}")
            all_passed = False
        
        # Test citizen login
        if citizen_token:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": citizen_email, "password": citizen_password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    print_test("POST /api/auth/login (citizen)", True, f"Login successful")
                else:
                    print_test("POST /api/auth/login (citizen)", False, "No token in response")
                    all_passed = False
            else:
                print_test("POST /api/auth/login (citizen)", False, f"Status: {response.status_code}")
                all_passed = False
        
        # Test GET /api/users/me/requests with citizen token
        if citizen_token:
            response = requests.get(
                f"{BASE_URL}/users/me/requests",
                headers={"Authorization": f"Bearer {citizen_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                requests_list = response.json()
                print_test("GET /api/users/me/requests (authenticated)", True, f"Returns {len(requests_list)} requests")
            else:
                print_test("GET /api/users/me/requests (authenticated)", False, f"Status: {response.status_code}")
                all_passed = False
        
        # Test GET /api/users/me/requests without token (should fail)
        response = requests.get(f"{BASE_URL}/users/me/requests", timeout=10)
        
        if response.status_code == 401:
            print_test("GET /api/users/me/requests (unauthenticated)", True, "Correctly returns 401")
        else:
            print_test("GET /api/users/me/requests (unauthenticated)", False, f"Expected 401, got {response.status_code}")
            all_passed = False
        
        return all_passed, citizen_token, citizen_mobile
        
    except Exception as e:
        print_test("Citizen auth and requests", False, f"Error: {str(e)}")
        return False, None, None

def test_grievance_submit_and_track(citizen_token, citizen_mobile):
    """Test grievance submission and tracking"""
    print("\n" + "="*80)
    print("TEST: Grievance Submit and Track")
    print("="*80)
    
    all_passed = True
    tracking_id = None
    
    try:
        # Submit grievance with citizen token
        response = requests.post(
            f"{BASE_URL}/grievances",
            json={
                "name": "TEST Citizen User",
                "mobile": citizen_mobile,
                "category": "Infrastructure",
                "description": "TEST grievance - Road repair needed on Main Street",
                "type": "Grievance"
            },
            headers={"Authorization": f"Bearer {citizen_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            tracking_id = data.get("tracking_id")
            
            if tracking_id and tracking_id.startswith("VSH-2026-"):
                print_test("POST /api/grievances (authenticated)", True, f"Created grievance: {tracking_id}")
            else:
                print_test("POST /api/grievances (authenticated)", False, f"Invalid tracking_id: {tracking_id}")
                all_passed = False
        else:
            print_test("POST /api/grievances (authenticated)", False, f"Status: {response.status_code}, Response: {response.text}")
            all_passed = False
        
        # Track grievance
        if tracking_id:
            response = requests.post(
                f"{BASE_URL}/grievances/track",
                json={
                    "tracking_id": tracking_id,
                    "mobile": citizen_mobile
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "updates" in data:
                    print_test("POST /api/grievances/track", True, f"Status: {data.get('status')}, Updates: {len(data.get('updates', []))}")
                else:
                    print_test("POST /api/grievances/track", False, f"Missing status or updates in response")
                    all_passed = False
            else:
                print_test("POST /api/grievances/track", False, f"Status: {response.status_code}")
                all_passed = False
            
            # Test tracking with wrong mobile (should fail)
            response = requests.post(
                f"{BASE_URL}/grievances/track",
                json={
                    "tracking_id": tracking_id,
                    "mobile": "9999999999"
                },
                timeout=10
            )
            
            if response.status_code == 404:
                print_test("POST /api/grievances/track (wrong mobile)", True, "Correctly returns 404")
            else:
                print_test("POST /api/grievances/track (wrong mobile)", False, f"Expected 404, got {response.status_code}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_test("Grievance submit and track", False, f"Error: {str(e)}")
        return False

def test_static_files():
    """Test static branding files"""
    print("\n" + "="*80)
    print("TEST: Static Branding Files")
    print("="*80)
    
    all_passed = True
    
    try:
        # Test BJP lotus logo
        response = requests.get(f"{FRONTEND_URL}/branding/bjp-lotus.svg", timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            if "svg" in content_type or response.text.startswith("<svg") or response.text.startswith("<?xml"):
                print_test("GET /branding/bjp-lotus.svg", True, f"Content-Type: {content_type}, Size: {len(response.content)} bytes")
            else:
                print_test("GET /branding/bjp-lotus.svg", False, f"Invalid content type: {content_type}")
                all_passed = False
        else:
            print_test("GET /branding/bjp-lotus.svg", False, f"Status: {response.status_code}")
            all_passed = False
        
        # Test MLA portrait
        response = requests.get(f"{FRONTEND_URL}/branding/vithal-halgekar.jpg", timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            if "image" in content_type:
                print_test("GET /branding/vithal-halgekar.jpg", True, f"Content-Type: {content_type}, Size: {len(response.content)} bytes")
            else:
                print_test("GET /branding/vithal-halgekar.jpg", False, f"Invalid content type: {content_type}")
                all_passed = False
        else:
            print_test("GET /branding/vithal-halgekar.jpg", False, f"Status: {response.status_code}")
            all_passed = False
        
        return all_passed
        
    except Exception as e:
        print_test("Static files", False, f"Error: {str(e)}")
        return False

def test_homepage():
    """Test homepage returns 200"""
    print("\n" + "="*80)
    print("TEST: Homepage")
    print("="*80)
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        
        if response.status_code == 200:
            # Check for basic HTML structure
            if "<html" in response.text.lower() and "</html>" in response.text.lower():
                print_test("GET / (homepage)", True, f"Status: 200, HTML content received ({len(response.text)} bytes)")
                return True
            else:
                print_test("GET / (homepage)", False, "Response is not valid HTML")
                return False
        else:
            print_test("GET / (homepage)", False, f"Status: {response.status_code}")
            return False
        
    except Exception as e:
        print_test("Homepage", False, f"Error: {str(e)}")
        return False

def main():
    """Run all backend regression tests"""
    print("\n" + "="*80)
    print("VSH MLA PORTAL - BACKEND REGRESSION TEST SUITE")
    print("Testing after visual redesign")
    print("="*80)
    
    # Run all tests
    test_settings_endpoint()
    test_stats_endpoint()
    test_list_endpoints()
    test_project_filters_and_details()
    test_news_details()
    
    auth_passed, admin_token = test_admin_auth()
    
    if admin_token:
        test_news_schemes_crud(admin_token)
    else:
        print("\n⚠️  Skipping News/Schemes CRUD tests (no admin token)")
    
    citizen_passed, citizen_token, citizen_mobile = test_citizen_auth_and_requests()
    
    if citizen_token and citizen_mobile:
        test_grievance_submit_and_track(citizen_token, citizen_mobile)
    else:
        print("\n⚠️  Skipping grievance tests (no citizen token)")
    
    test_static_files()
    test_homepage()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {tests_passed + tests_failed}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
    print("="*80 + "\n")
    
    if tests_failed > 0:
        print("FAILED TESTS:")
        for result in test_results:
            if not result["passed"]:
                print(f"  ❌ {result['name']}")
                if result["details"]:
                    print(f"     {result['details']}")
        print()
    
    return tests_failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
