import math
import numpy as np
from typing import Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def build_distance_matrix(locations) -> np.ndarray:
    n = len(locations)
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i, j] = haversine_distance(
                    locations[i].lat, locations[i].lng,
                    locations[j].lat, locations[j].lng
                )
    return matrix


def calc_W(clusters: list[list[int]], dist_matrix: np.ndarray) -> float:
    max_diam = 0.0
    for comp in clusters:
        for i in range(len(comp)):
            for j in range(i + 1, len(comp)):
                max_diam = max(max_diam, dist_matrix[comp[i]][comp[j]])
    return max_diam


def calc_D(clusters: list[list[int]], dist_matrix: np.ndarray) -> float:
    if len(clusters) < 2:
        return float('inf')
    min_dist = float('inf')
    for i in range(len(clusters)):
        for j in range(i + 1, len(clusters)):
            for u in clusters[i]:
                for v in clusters[j]:
                    min_dist = min(min_dist, dist_matrix[u][v])
    return min_dist


def is_compact(clusters: list[list[int]], dist_matrix: np.ndarray) -> bool:
    if len(clusters) == 1:
        return True  
    return calc_W(clusters, dist_matrix) < calc_D(clusters, dist_matrix)


def try_build_partition(r: float,
                        dist_matrix: np.ndarray,
                        n: int) -> Optional[list[list[int]]]:
    adj = [[dist_matrix[i][j] < r for j in range(n)] for i in range(n)]

    visited = [False] * n
    clusters = []
    for start in range(n):
        if not visited[start]:
            comp = []
            queue = [start]
            visited[start] = True
            while queue:
                u = queue.pop(0)
                comp.append(u)
                for v in range(n):
                    if adj[u][v] and not visited[v]:
                        visited[v] = True
                        queue.append(v)
            clusters.append(comp)

    for comp in clusters:
        for i in range(len(comp)):
            for j in range(i + 1, len(comp)):
                if dist_matrix[comp[i]][comp[j]] > r:
                    return None

    return clusters

def compact_clustering(locations, r_preference: float = 2.0) -> list[list[int]]:
    n = len(locations)
    if n == 0:
        return []
    if n == 1:
        return [[0]]

    dist_matrix = build_distance_matrix(locations)

    unique_dists = sorted({
        dist_matrix[i][j]
        for i in range(n)
        for j in range(i + 1, n)
    })

    pi = try_build_partition(r_preference, dist_matrix, n)

    if pi is not None and is_compact(pi, dist_matrix):
        return pi

    d_less    = [d for d in unique_dists if d < r_preference]
    d_greater = [d for d in unique_dists if d > r_preference]
    r_minus = max(d_less)    if d_less    else 0.0
    r_plus  = min(d_greater) if d_greater else float('inf')

    visited_pairs: set[tuple[float, float]] = set()

    while True:
        pair = (r_minus, r_plus)
        if pair in visited_pairs:
            return [[i for i in range(n)]]
        visited_pairs.add(pair)

        pi_minus = try_build_partition(r_minus, dist_matrix, n)
        pi_plus  = (try_build_partition(r_plus, dist_matrix, n)
                    if r_plus != float('inf') else [[i for i in range(n)]])

        if pi_minus is not None and not is_compact(pi_minus, dist_matrix):
            pi_minus = None
        if pi_plus is not None and not is_compact(pi_plus, dist_matrix):
            pi_plus = None

        if pi_minus is not None and pi_plus is None:
            return pi_minus
        if pi_plus is not None and pi_minus is None:
            return pi_plus

        if pi_minus is not None and pi_plus is not None:
            metric_minus = abs(
                (calc_D(pi_minus, dist_matrix) + calc_W(pi_minus, dist_matrix)) / 2
                - r_preference
            )
            metric_plus = abs(
                (calc_D(pi_plus, dist_matrix) + calc_W(pi_plus, dist_matrix)) / 2
                - r_preference
            )
            return pi_minus if metric_minus <= metric_plus else pi_plus

        d_less_new    = [d for d in unique_dists if d < r_minus]
        d_greater_new = [d for d in unique_dists if d > r_plus]

        if not d_less_new and not d_greater_new:
            return [[i for i in range(n)]]

        r_minus = max(d_less_new)    if d_less_new    else 0.0
        r_plus  = min(d_greater_new) if d_greater_new else float('inf')

