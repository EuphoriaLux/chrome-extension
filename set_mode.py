import configparser
import sys

def set_mode(mode):
    config = configparser.ConfigParser()
    config.read('config.ini')
    config['mode']['current_mode'] = mode
    with open('config.ini', 'w') as configfile:
        config.write(configfile)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python set_mode.py <mode>")
        sys.exit(1)
    mode = sys.argv[1]
    set_mode(mode)
    print(f"Mode set to: {mode}")
