from typing import List, Dict, Any

def calculate_personal_baseline(history: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculates the personal average physiological baseline from historical health records.
    """
    if not history:
        return {
            "heartRate": 70.0,
            "spo2": 98.0,
            "sleep": 7.6,
            "activity": 65.0
        }
    
    total_hr = sum(float(item.get("heartRate", 70.0)) for item in history)
    total_spo2 = sum(float(item.get("spo2", 98.0)) for item in history)
    total_sleep = sum(float(item.get("sleep", 7.5)) for item in history)
    total_activity = sum(float(item.get("activity", 65.0)) for item in history)
    count = len(history)

    return {
        "heartRate": round(total_hr / count, 1),
        "spo2": round(total_spo2 / count, 1),
        "sleep": round(total_sleep / count, 1),
        "activity": round(total_activity / count, 1)
    }

def calculate_mission_baseline(history: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculates the mission cohort-level baseline across all astronaut records.
    """
    if not history:
        return {
            "heartRate": 72.0,
            "spo2": 97.8,
            "sleep": 7.8,
            "activity": 62.0
        }
    
    return calculate_personal_baseline(history)

def calculate_deviation(current: Dict[str, float], baseline: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
    """
    Calculates absolute and percentage deviations between current metrics and a baseline.
    """
    deviations = {}
    for key in ["heartRate", "spo2", "sleep", "activity"]:
        c_val = float(current.get(key, 0.0))
        b_val = float(baseline.get(key, 1.0))
        if b_val == 0:
            b_val = 1.0
        
        diff = c_val - b_val
        pct = (diff / b_val) * 100.0
        
        deviations[key] = {
            "current": c_val,
            "baseline": b_val,
            "diff": round(diff, 2),
            "percentage": round(pct, 2),
            "formatted": f"{'+' if pct >= 0 else ''}{round(pct, 1)}%"
        }
    
    return deviations
