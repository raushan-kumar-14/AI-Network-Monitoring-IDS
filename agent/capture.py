from scapy.all import sniff, IP, TCP, UDP, ICMP
import requests

from config import BACKEND_URL, USERNAME

capture_running=False


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
        protocol = "OTHER"

    data = {
        "owner_username": USERNAME,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "protocol": protocol,
        "packet_size": float(len(packet))
    }

    try:
        requests.post(
            f"{BACKEND_URL}/logs",
            json=data,
            timeout=2
        )
    except Exception as e:
        print(e)


def start_capture():
    global capture_running

    capture_running = True

    print("Agent started...")

    sniff(
        prn=process_packet,
        store=False,
        stop_filter=lambda packet: not capture_running
    )
def stop_capture():
    global capture_running
    print("Stopping capture...")
    capture_running = False