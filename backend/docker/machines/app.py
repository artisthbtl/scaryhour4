from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Welcome to the target machine! There might be other pages to discover..."

@app.route('/secret-area')
def secret():
    return "You found the secret area! Good job."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)