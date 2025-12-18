from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict, dataclass
import json
from typing import Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class Node:
    id: str
    label: str
    category: str


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    relation: str


def build_sample_graph() -> Tuple[Dict[str, Node], List[Edge]]:
    """Create a small knowledge graph for two auditable entities."""
    nodes: Iterable[Node] = (
        # Auditable entities
        Node("auditable:ap", "Accounts Payable", "auditable_entity"),
        Node("auditable:uac", "User Access Management", "auditable_entity"),
        # Risks
        Node("risk:ap-fraud", "Vendor payment fraud", "risk"),
        Node("risk:ap-dup", "Duplicate invoice processing", "risk"),
        Node("risk:uac-priv", "Excessive privileged access", "risk"),
        Node("risk:uac-term", "Terminated user retains access", "risk"),
        # Controls
        Node("control:ap-three-way", "3-way match before payment", "control"),
        Node("control:ap-sod", "Segregation of duties for invoice approval", "control"),
        Node("control:uac-cert", "Quarterly access certification", "control"),
        Node("control:uac-join-leaver", "Joiner-mover-leaver process", "control"),
        # Regulations
        Node("reg:sox", "SOX 404", "regulation"),
        Node("reg:gdpr", "GDPR Article 32", "regulation"),
        # Vendors
        Node("vendor:ap-platform", "PayMeNow Outsourcing", "vendor"),
        Node("vendor:iam", "SecureID Identity", "vendor"),
        # Systems
        Node("system:erp", "Oracle ERP", "system"),
        Node("system:ap-portal", "Supplier Portal", "system"),
        Node("system:iam", "SailPoint", "system"),
        Node("system:hris", "Workday", "system"),
        # GL accounts
        Node("gl:2000", "2000 - Accounts Payable", "gl_account"),
        Node("gl:6105", "6105 - Software Subscriptions", "gl_account"),
        # Test procedures
        Node("test:ap-samples", "Sample invoices for 3-way match evidence", "test_procedure"),
        Node("test:ap-analytics", "Identify duplicate invoice numbers", "test_procedure"),
        Node("test:uac-recert", "Review access certification evidence", "test_procedure"),
        Node("test:uac-terminations", "Check leaver access revocation within SLA", "test_procedure"),
        # Audit analytics
        Node("analytic:ap-dup", "Duplicate invoice detection by vendor/amount/date", "audit_analytic"),
        Node("analytic:ap-outlier", "Benford analysis on invoice amounts", "audit_analytic"),
        Node("analytic:uac-stale", "Stale accounts without recent login", "audit_analytic"),
        Node("analytic:uac-priv", "Privileged role change monitoring", "audit_analytic"),
    )

    edges: List[Edge] = [
        # Auditable entity to risk
        Edge("auditable:ap", "risk:ap-fraud", "has_risk"),
        Edge("auditable:ap", "risk:ap-dup", "has_risk"),
        Edge("auditable:uac", "risk:uac-priv", "has_risk"),
        Edge("auditable:uac", "risk:uac-term", "has_risk"),
        # Risk to control
        Edge("risk:ap-fraud", "control:ap-three-way", "mitigated_by"),
        Edge("risk:ap-fraud", "control:ap-sod", "mitigated_by"),
        Edge("risk:ap-dup", "control:ap-three-way", "mitigated_by"),
        Edge("risk:uac-priv", "control:uac-cert", "mitigated_by"),
        Edge("risk:uac-term", "control:uac-join-leaver", "mitigated_by"),
        # Regulation coverage
        Edge("control:ap-three-way", "reg:sox", "supports_regulation"),
        Edge("control:ap-sod", "reg:sox", "supports_regulation"),
        Edge("control:uac-cert", "reg:sox", "supports_regulation"),
        Edge("control:uac-join-leaver", "reg:gdpr", "supports_regulation"),
        # Vendors and systems
        Edge("auditable:ap", "vendor:ap-platform", "outsourced_to"),
        Edge("auditable:uac", "vendor:iam", "outsourced_to"),
        Edge("vendor:ap-platform", "system:ap-portal", "operates"),
        Edge("vendor:iam", "system:iam", "operates"),
        Edge("system:iam", "system:hris", "ingests_identity_from"),
        Edge("auditable:ap", "system:erp", "records_in"),
        Edge("auditable:ap", "system:ap-portal", "records_in"),
        # GL coverage
        Edge("auditable:ap", "gl:2000", "posts_to"),
        Edge("auditable:uac", "gl:6105", "impacts_expense"),
        # Test procedures linked to controls
        Edge("control:ap-three-way", "test:ap-samples", "validated_by"),
        Edge("control:ap-three-way", "test:ap-analytics", "validated_by"),
        Edge("control:uac-cert", "test:uac-recert", "validated_by"),
        Edge("control:uac-join-leaver", "test:uac-terminations", "validated_by"),
        # Audit analytics linked to procedures
        Edge("test:ap-analytics", "analytic:ap-dup", "uses"),
        Edge("risk:ap-dup", "analytic:ap-dup", "informed_by"),
        Edge("risk:ap-fraud", "analytic:ap-outlier", "informed_by"),
        Edge("test:uac-terminations", "analytic:uac-stale", "uses"),
        Edge("risk:uac-priv", "analytic:uac-priv", "informed_by"),
    ]

    node_index = {node.id: node for node in nodes}
    missing_nodes = {edge.source for edge in edges if edge.source not in node_index} | {
        edge.target for edge in edges if edge.target not in node_index
    }
    if missing_nodes:
        raise ValueError(f"Edges reference undefined nodes: {sorted(missing_nodes)}")
    return node_index, edges


def summarize_by_category(nodes: Dict[str, Node]) -> Dict[str, List[Node]]:
    grouped: Dict[str, List[Node]] = defaultdict(list)
    for node in nodes.values():
        grouped[node.category].append(node)
    for bucket in grouped.values():
        bucket.sort(key=lambda item: item.label)
    return dict(grouped)


def export_as_json(nodes: Dict[str, Node], edges: List[Edge]) -> str:
    payload = {
        "nodes": [asdict(node) for node in nodes.values()],
        "edges": [asdict(edge) for edge in edges],
    }
    return json.dumps(payload, indent=2)


def _print_human_readable(nodes: Dict[str, Node], edges: List[Edge]) -> None:
    print("=== Knowledge Graph Overview ===")
    grouped = summarize_by_category(nodes)
    for category, bucket in sorted(grouped.items()):
        print(f"\n{category.upper()}:")
        for node in bucket:
            print(f"  - {node.label} ({node.id})")

    print("\nRELATIONSHIPS:")
    for edge in edges:
        print(f"  {edge.source} --{edge.relation}--> {edge.target}")

    print("\nJSON export preview:")
    print(export_as_json(nodes, edges))


if __name__ == "__main__":
    graph_nodes, graph_edges = build_sample_graph()
    _print_human_readable(graph_nodes, graph_edges)
