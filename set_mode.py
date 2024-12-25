import configparser
import sys
import os

def set_mode(mode):
    config = configparser.ConfigParser()
    try:
        config.read('config.ini')
    except Exception as e:
        print(f"Error reading config.ini: {e}")
        return False
    config['mode']['current_mode'] = mode
    try:
        with open('config.ini', 'w') as configfile:
            config.write(configfile)
    except Exception as e:
        print(f"Error writing config.ini: {e}")
        return False
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python set_mode.py <mode>")
        sys.exit(1)
    mode = sys.argv[1]
    if set_mode(mode):
        print(f"Mode set to: {mode}")
    else:
        sys.exit(1)
    
