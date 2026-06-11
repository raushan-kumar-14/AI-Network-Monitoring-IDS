import random

def predict_attack(protocol: str, packet_size: float):
    """
    Temporary AI model.
    Later this will be replaced with a trained ML model.
    """

    if packet_size > 1000:
        return "Suspicious", 0.92

    if protocol.upper() == "ICMP":
        return "Potential Scan", 0.81

    return "Normal", round(random.uniform(0.85, 0.99), 2)