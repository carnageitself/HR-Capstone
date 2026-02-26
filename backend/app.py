from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
from datetime import datetime
import csv
import webbrowser

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Data directory
DATA_DIR = '../data'

# Load CSV files
def load_csv(filename):
    """Load CSV file with error handling"""
    filepath = os.path.join(DATA_DIR, filename)
    try:
        return pd.read_csv(filepath)
    except Exception as e:
        return None

# Cache loaded data (will be refreshed on each request)
employees_df = None
departments_df = None
companies_df = None
awards_df = None
categories_df = None
skills_df = None
employee_skills_df = None

def reload_data():
    """Reload all data from CSV files"""
    global employees_df, departments_df, companies_df, awards_df, categories_df, skills_df, employee_skills_df
    employees_df = load_csv('employees.csv')
    departments_df = load_csv('departments.csv')
    companies_df = load_csv('companies.csv')
    awards_df = load_csv('awards.csv')
    categories_df = load_csv('award_categories.csv')
    skills_df = load_csv('skills.csv')
    employee_skills_df = load_csv('employee_skills.csv')

# Load data on startup
reload_data()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

# ============ EMPLOYEE ENDPOINTS ============

@app.route('/api/employees', methods=['GET'])
def get_employees():
    """Get all employees with search/filter"""
    reload_data()
    if employees_df is None or employees_df.empty:
        return jsonify({'error': 'No employee data found. Check data/employees.csv'}), 500

    search = request.args.get('search', '').lower()
    department_id = request.args.get('department_id', None)

    df = employees_df.copy()

    if search:
        df = df[
            df['first_name'].str.lower().str.contains(search, na=False) |
            df['last_name'].str.lower().str.contains(search, na=False) |
            df['email'].str.lower().str.contains(search, na=False)
        ]

    if department_id:
        df = df[df['department_id'] == department_id]

    resp = jsonify(df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

@app.route('/api/employees/<employee_id>', methods=['GET'])
def get_employee(employee_id):
    """Get detailed employee profile with awards and skills"""
    if employees_df is None:
        return jsonify({'error': 'Data not found'}), 500

    emp = employees_df[employees_df['employee_id'] == employee_id]
    if emp.empty:
        return jsonify({'error': 'Employee not found'}), 404

    emp_data = emp.to_dict(orient='records')[0]

    # Get employee's awards
    emp_awards = awards_df[awards_df['recipient_id'] == employee_id]
    emp_data['awards_received'] = emp_awards.to_dict(orient='records')
    emp_data['total_awards'] = len(emp_awards)
    emp_data['total_monetary_value'] = emp_awards['monetary_value_usd'].sum() if len(emp_awards) > 0 else 0

    # Get employee's skills
    emp_skills = employee_skills_df[employee_skills_df['employee_id'] == employee_id]
    emp_data['skills'] = emp_skills.to_dict(orient='records')

    # Get department info
    dept = departments_df[departments_df['department_id'] == emp_data['department_id']]
    if not dept.empty:
        emp_data['department_name'] = dept.iloc[0]['department_name']

    resp = jsonify(emp_data)
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

# ============ AWARDS ENDPOINTS ============

@app.route('/api/awards', methods=['GET'])
def get_awards():
    """Get all awards with filters"""
    reload_data()
    if awards_df is None:
        return jsonify({'error': 'Data not found'}), 500

    category_id = request.args.get('category_id', None)
    employee_id = request.args.get('employee_id', None)
    start_date = request.args.get('start_date', None)
    end_date = request.args.get('end_date', None)

    df = awards_df.copy()

    if category_id:
        df = df[df['category_id'] == category_id]

    if employee_id:
        df = df[df['recipient_id'] == employee_id]

    if start_date:
        df = df[df['award_date'] >= start_date]

    if end_date:
        df = df[df['award_date'] <= end_date]

    resp = jsonify(df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

@app.route('/api/awards/statistics', methods=['GET'])
def get_awards_stats():
    """Get awards statistics"""
    if awards_df is None:
        return jsonify({'error': 'Data not found'}), 500

    stats = {
        'total_awards': len(awards_df),
        'total_monetary_value': awards_df['monetary_value_usd'].sum(),
        'average_award_value': awards_df['monetary_value_usd'].mean(),
        'awards_by_category': awards_df.groupby('category_id').size().to_dict(),
        'awards_by_status': awards_df.groupby('award_status').size().to_dict(),
        'top_recipients': awards_df.groupby('recipient_id').size().nlargest(10).to_dict()
    }

    resp = jsonify(stats)
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

# ============ DEPARTMENT ENDPOINTS ============

@app.route('/api/departments', methods=['GET'])
def get_departments():
    """Get all departments"""
    reload_data()
    if departments_df is None:
        return jsonify({'error': 'Data not found'}), 500

    resp = jsonify(departments_df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

@app.route('/api/departments/<department_id>', methods=['GET'])
def get_department(department_id):
    """Get department with team members"""
    if departments_df is None:
        return jsonify({'error': 'Data not found'}), 500

    dept = departments_df[departments_df['department_id'] == department_id]
    if dept.empty:
        return jsonify({'error': 'Department not found'}), 404

    dept_data = dept.to_dict(orient='records')[0]

    # Get team members
    team = employees_df[employees_df['department_id'] == department_id]
    dept_data['team_members'] = team.to_dict(orient='records')
    dept_data['team_size'] = len(team)

    resp = jsonify(dept_data)
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

# ============ SKILLS ENDPOINTS ============

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get all skills"""
    if skills_df is None:
        return jsonify({'error': 'Data not found'}), 500

    category = request.args.get('category', None)
    df = skills_df.copy()

    if category:
        df = df[df['skill_category'] == category]

    resp = jsonify(df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

@app.route('/api/employee/<employee_id>/skills', methods=['GET'])
def get_employee_skills(employee_id):
    """Get skills for specific employee"""
    if employee_skills_df is None:
        return jsonify({'error': 'Data not found'}), 500

    emp_skills = employee_skills_df[employee_skills_df['employee_id'] == employee_id]

    result = []
    for _, skill in emp_skills.iterrows():
        skill_info = skills_df[skills_df['skill_id'] == skill['skill_id']]
        if not skill_info.empty:
            skill_data = skill_info.iloc[0].to_dict()
            skill_data['proficiency_level'] = skill['proficiency_level']
            skill_data['years_experience'] = skill['years_experience']
            skill_data['certified'] = skill['certified']
            result.append(skill_data)

    resp = jsonify(result)
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

# ============ CATEGORIES ENDPOINTS ============

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all award categories"""
    reload_data()
    if categories_df is None:
        return jsonify({'error': 'Data not found'}), 500

    resp = jsonify(categories_df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

@app.route('/api/all-employee-skills', methods=['GET'])
def get_all_employee_skills():
    """Get all employee skills mappings"""
    reload_data()
    if employee_skills_df is None:
        return jsonify({'error': 'Data not found'}), 500

    resp = jsonify(employee_skills_df.to_dict(orient='records'))
    resp.headers['Content-Type'] = 'application/json'
    return resp, 200

# Alias for backwards compatibility
@app.route('/api/employee-skills', methods=['GET'])
def get_all_employee_skills_alias():
    """Alias for /api/all-employee-skills"""
    return get_all_employee_skills()

# ============ ADMIN ENDPOINTS ============

@app.route('/api/admin/employees', methods=['POST'])
def create_employee():
    """Create new employee"""
    try:
        data = request.json
        employees_df.loc[len(employees_df)] = data
        employees_df.to_csv(os.path.join(DATA_DIR, 'employees.csv'), index=False)
        return jsonify({'status': 'success', 'data': data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/departments', methods=['POST'])
def create_department():
    """Create new department"""
    try:
        data = request.json
        departments_df.loc[len(departments_df)] = data
        departments_df.to_csv(os.path.join(DATA_DIR, 'departments.csv'), index=False)
        return jsonify({'status': 'success', 'data': data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/skills', methods=['POST'])
def create_skill():
    """Create new skill"""
    try:
        data = request.json
        skills_df.loc[len(skills_df)] = data
        skills_df.to_csv(os.path.join(DATA_DIR, 'skills.csv'), index=False)
        return jsonify({'status': 'success', 'data': data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/awards', methods=['POST'])
def create_award():
    """Create new award"""
    try:
        data = request.json
        data['award_date'] = datetime.now().strftime('%Y-%m-%d')
        awards_df.loc[len(awards_df)] = data
        awards_df.to_csv(os.path.join(DATA_DIR, 'awards.csv'), index=False)
        return jsonify({'status': 'success', 'data': data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============ FRONTEND SERVING (LAST - CATCH-ALL) ============

@app.after_request
def add_cache_headers(response):
    """Add cache-busting headers to all responses"""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0, public'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Last-Modified'] = 'Thu, 01 Jan 1970 00:00:00 GMT'
    return response

@app.route('/')
def serve_frontend():
    """Serve frontend index.html"""
    response = send_from_directory('../frontend', 'index.html')
    response.cache_control.no_store = True
    response.cache_control.no_cache = True
    response.cache_control.must_revalidate = True
    response.cache_control.max_age = 0
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, etc) and fallback to index.html for SPA routing"""
    # This catch-all only handles frontend files
    # If Flask reaches here with /api/*, it means the route doesn't exist
    # (specific /api/* routes are defined before this catch-all)

    # Block any /api/* paths from being served as frontend files
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404

    # Try to serve as static file from frontend folder
    try:
        response = send_from_directory('../frontend', path)
    except:
        # If file doesn't exist, serve index.html for SPA client-side routing
        response = send_from_directory('../frontend', 'index.html')

    # Add cache-busting headers for JS/CSS
    if path.endswith(('.js', '.css', '.html')):
        response.cache_control.no_store = True
        response.cache_control.no_cache = True
        response.cache_control.must_revalidate = True
        response.cache_control.max_age = 0
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

    return response

if __name__ == '__main__':
    import threading
    import time

    # Open browser after a short delay
    def open_browser():
        time.sleep(2)  # Wait for server to start
        webbrowser.open('http://localhost:5000')

    # Start browser in background thread
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    print("\n" + "="*60)
    print("HR Award Management System Starting...")
    print("="*60)
    print("Dashboard: http://localhost:5000")
    print("API: http://localhost:5000/api")
    print("Press CTRL+C to stop\n")
    print("="*60 + "\n")

    app.run(debug=True, port=5000, use_reloader=False)
