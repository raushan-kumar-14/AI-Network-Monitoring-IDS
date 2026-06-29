from scapy.all import sniff, IP, TCP, UDP, ICMP 
import requests
import threading

CURRENT_OWNER = "admin"
capture_running=False
capture_thread=None

def set_owner(owner):
    global CURRENT_OWNER
    CURRENT_OWNER = owner

API_URL = "https://netsentinel-backend-hm6r.onrender.com/logs"


def process_packet(packet):
    if IP not in packet:
        return

    source_ip = packet[IP].src
    destination_ip = packet[IP].dst

    if TCP in packet:
        protocol = "TCP"
    elif UDP in packet:
        protocol = "UDP"
    elif ICMP in packet:
        protocol = "ICMP"
    else:
        protocol = "other"
    print(packet.summary())

    packet_size = float(len(packet))

    data = {
    "owner_username": CURRENT_OWNER,
    "source_ip": source_ip,
    "destination_ip": destination_ip,
    "protocol": protocol,
    "packet_size": packet_size
}

    try:
        response = requests.post(API_URL, json=data, timeout=2)

        if response.status_code == 200:
            print(
                f"[+] Logged: {source_ip} -> {destination_ip} | "
                f"{protocol} | {packet_size}"
            )
        else:
            print(f"[!] API Error: {response.status_code}")

    except Exception as e:
        print(f"[!] Connection Error: {e}")


def start_sniffer():
    print("AI Network IDS Live Packet Capture Started...")

    sniff(
        prn=process_packet,
        store=False,
        stop_filter=lambda packet: not capture_running
    )


def start_capture():
    global capture_thread, capture_running

    if capture_running:
        return

    capture_running = True

    capture_thread = threading.Thread(
        target=start_sniffer,
        daemon=True
    )
    capture_thread.start()


def stop_capture():
    global capture_running
    capture_running = False


if __name__ == "__main__":
    start_sniffer()