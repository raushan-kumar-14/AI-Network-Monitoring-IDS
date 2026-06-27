import sys
import config
from capture import start_capture


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("python agent.py <username>")
        return

    username = sys.argv[1]

    config.USERNAME = username

    print("=" * 50)
    print("NetSentinel Agent")
    print("=" * 50)
    print(f"Logged in as : {username}")
    print("Starting live packet capture...")
    print("=" * 50)

    start_capture()


if __name__ == "__main__":
    main()
    