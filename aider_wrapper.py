import subprocess
import sys
import os

def get_current_mode():
    config = configparser.ConfigParser()
    try:
        config.read('config.ini')
        return config['mode']['current_mode']
    except Exception as e:
        print(f"Error reading config.ini: {e}")
        return None

def run_aider():
    mode = get_current_mode()
    if mode is None:
        print("Could not determine current mode. Exiting.")
        sys.exit(1)

    aider_args = sys.argv[1:]

    if mode == "architect":
        print("Running aider in architect mode...")
        # Add any specific arguments for architect mode here
        # For example, you could enable a specific plugin or set a different model
        # aider_args.extend(["--model", "gpt-4-architect"])
    else:
        print("Running aider in normal mode...")

    try:
        subprocess.run(["aider"] + aider_args, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Aider failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_aider()
