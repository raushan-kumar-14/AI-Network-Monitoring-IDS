from scapy.all import sniff, IP, TCP, UDP, ICMP
import requests

import time
import config

print("===capture.py loaded===")  
capture_running=False


packet_count = 0
capture_start_time = None

def process_packet(packet):
    print("process_packet called")
    global packet_count
    packet_count += 1
    
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
        "owner_username": config.USERNAME,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "protocol": protocol,
        "packet_size": float(len(packet))
    }

    try:
        print("Sending packet for:", config.USERNAME)
        print(data)
        requests.post(
            f"{config.BACKEND_URL}/logs",
            json=data,
            timeout=2
        )
    except Exception as e:
        print(e)


def start_capture():
    global capture_running
    
    global capture_start_time
    global packet_count

    packet_count = 0
    capture_start_time = time.time()

    capture_running = True

    print("Agent started...")

    sniff(
        prn=process_packet,
        store=False,
        stop_filter=lambda packet: not capture_running
    )
def stop_capture():
    global capture_running
    global capture_start_time

    print("Stopping capture...")

    capture_running = False
    capture_start_time = None
def get_stats():
    if capture_running and capture_start_time:
        uptime = int(time.time() - capture_start_time)
    else:
        uptime = 0
    
    print("capture_running =", capture_running)
    print("capture_start_time =", capture_start_time)

    return {
        "running": capture_running,
        "packet_count": packet_count,
        "uptime": uptime
    }