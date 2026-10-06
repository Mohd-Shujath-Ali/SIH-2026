import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  Share2,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldAlert,
  FileText,
  Users,
  Building2,
  MapPin,
  Car,
  Phone,
  CreditCard,
  Crosshair,
  Info,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  Minimize2,
  RotateCw,
} from "lucide-react";
import { FinalNetwork, Entity, Relationship } from "../types";

interface NetworkGraphViewProps {
  finalNetwork: FinalNetwork | null;
  onReloadNetwork?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  finalNetwork,
  onReloadNetwork,
  isLoading,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(null);
  const [showHiddenOnly, setShowHiddenOnly] = useState<boolean>(false);
  const [isStationary, setIsStationary] = useState<boolean>(false);
  const [layoutTrigger, setLayoutTrigger] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<"LANES" | "RINGS">("LANES");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Tactical Colors
  const typeColors: Record<string, string> = {
    PERSON: "#10b981", // Emerald
    ORGANIZATION: "#3b82f6", // Blue
    LOCATION: "#f59e0b", // Amber
    VEHICLE: "#a855f7", // Purple
    PHONE: "#06b6d4", // Cyan
    FINANCIAL_ACCOUNT: "#eab308", // Yellow Gold
    WEAPON: "#ef4444", // Crimson Red
    DEFAULT: "#94a3b8", // Slate
  };

  const getNodeColor = (type: string) => typeColors[type] || typeColors.DEFAULT;

  useEffect(() => {
    if (!svgRef.current || !finalNetwork || finalNetwork.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerRef.current?.clientWidth || 800;
    const height = 550;

    // Filter nodes and edges based on search and filters
    let visibleNodes = finalNetwork.nodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.aliases || []).some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "ALL" || node.type === selectedType;
      return matchesSearch && matchesType;
    });

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    let visibleEdges = finalNetwork.edges.filter((e) => {
      const hasBothNodes = visibleNodeIds.has(e.sourceId) && visibleNodeIds.has(e.targetId);
      const matchesHidden = !showHiddenOnly || e.isHiddenConnection;
      return hasBothNodes && matchesHidden;
    });

    // Deep clone data for D3 simulation
    const nodesData = visibleNodes.map((d) => ({ ...d }));
    const linksData = visibleEdges.map((d) => ({
      ...d,
      source: d.sourceId,
      target: d.targetId,
    }));

    // Main Graph Container with Zoom support
    const g = svg.append("g").attr("class", "graph-content");
    gRef.current = g as any;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Defs: Arrowhead markers
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow-solid")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 5.5)
      .attr("markerHeight", 5.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#60a5fa");

    defs
      .append("marker")
      .attr("id", "arrow-dashed")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 5.5)
      .attr("markerHeight", 5.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#c084fc");

    const cx = width / 2;
    const cy = height / 2;

    // Layout calculation based on selected layout mode
    if (layoutMode === "LANES") {
      // Clean, uncrossed intelligence pipeline layout
      const laneDefinitions = [
        { title: "COMMAND & SUSPECTS", filter: (d: any) => d.type === "PERSON" },
        {
          title: "SHELLS & HAWALA",
          filter: (d: any) => d.type === "ORGANIZATION" || d.type === "FINANCIAL_ACCOUNT",
        },
        {
          title: "LOGISTICS & HUBS",
          filter: (d: any) => d.type === "LOCATION" || d.type === "VEHICLE",
        },
        {
          title: "TACTICAL & DEVICES",
          filter: (d: any) =>
            d.type === "PHONE" ||
            d.type === "WEAPON" ||
            !["PERSON", "ORGANIZATION", "FINANCIAL_ACCOUNT", "LOCATION", "VEHICLE"].includes(
              d.type
            ),
        },
      ];

      const laneNodes = laneDefinitions.map((def) =>
        nodesData
          .filter(def.filter)
          .sort((a: any, b: any) => (b.centralityScore || 0) - (a.centralityScore || 0))
      );

      const activeLanes = laneDefinitions
        .map((def, idx) => ({ ...def, nodes: laneNodes[idx], origIdx: idx }))
        .filter((l) => l.nodes.length > 0);

      const numCols = activeLanes.length;
      const leftPad = 85;
      const rightPad = 85;
      const colWidth = numCols > 1 ? (width - leftPad - rightPad) / (numCols - 1) : 0;

      // Draw subtle lane headers on the canvas background
      const laneHeaderGroup = g.append("g").attr("class", "lane-headers");

      activeLanes.forEach((lane, colIdx) => {
        const colX = numCols === 1 ? width / 2 : leftPad + colIdx * colWidth;
        const total = lane.nodes.length;
        const topY = 70;
        const botY = height - 70;
        const stepY = total > 1 ? (botY - topY) / (total - 1) : 0;

        // Lane title
        laneHeaderGroup
          .append("text")
          .attr("x", colX)
          .attr("y", 32)
          .attr("text-anchor", "middle")
          .attr("font-size", 9)
          .attr("font-family", "monospace")
          .attr("font-weight", "600")
          .attr("letter-spacing", "0.08em")
          .attr("fill", "#64748b")
          .attr("opacity", 0.7)
          .text(`[ ${lane.title} ]`);

        // Subtle vertical guideline
        laneHeaderGroup
          .append("line")
          .attr("x1", colX)
          .attr("y1", 44)
          .attr("x2", colX)
          .attr("y2", height - 35)
          .attr("stroke", "#172233")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");

        lane.nodes.forEach((node: any, rowIdx: number) => {
          node.x = colX;
          node.y = total === 1 ? height / 2 : topY + rowIdx * stepY;
          node.fx = node.x;
          node.fy = node.y;
          node.vx = 0;
          node.vy = 0;
        });
      });
    } else {
      // Concentric Radial Mode
      const tier1 = nodesData.filter(
        (d: any) => d.isKeyInfluencer || (d.centralityScore || 0) >= 0.75
      );
      const tier2 = nodesData.filter(
        (d: any) =>
          !tier1.includes(d) &&
          (d.type === "ORGANIZATION" || d.type === "PERSON" || d.type === "FINANCIAL_ACCOUNT")
      );
      const tier3 = nodesData.filter(
        (d: any) => !tier1.includes(d) && !tier2.includes(d)
      );

      const minDim = Math.min(width, height);
      const positionRing = (ringNodes: any[], radius: number, startAngle: number = 0) => {
        const len = ringNodes.length;
        if (len === 0) return;
        ringNodes.forEach((node: any, i: number) => {
          const angle = startAngle + (i / len) * 2 * Math.PI;
          node.x = cx + radius * Math.cos(angle);
          node.y = cy + radius * Math.sin(angle);
          node.vx = 0;
          node.vy = 0;
        });
      };

      positionRing(tier1, minDim * 0.16, -Math.PI / 2);
      positionRing(tier2, minDim * 0.32, 0);
      positionRing(tier3, minDim * 0.44, Math.PI / 4);
    }

    // Force simulation for physics (when in RINGS mode, or for gentle link alignment)
    const simulation = d3
      .forceSimulation(nodesData as any)
      .force(
        "link",
        d3
          .forceLink(linksData)
          .id((d: any) => d.id)
          .distance((d: any) => (d.isHiddenConnection ? 140 : 115))
          .strength(layoutMode === "LANES" ? 0 : 0.6)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(layoutMode === "LANES" ? 0 : -350).distanceMax(500)
      )
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(layoutMode === "LANES" ? 35 : 44)
          .strength(0.8)
      )
      .alpha(layoutMode === "LANES" ? 0.05 : 0.6)
      .alphaDecay(0.05)
      .velocityDecay(0.45);

    // Compute smooth cubic bezier path between nodes to eliminate harsh criss-crossing
    const computeLinkPath = (d: any) => {
      const sx = d.source.x ?? 0;
      const sy = d.source.y ?? 0;
      const tx = d.target.x ?? 0;
      const ty = d.target.y ?? 0;

      const dx = tx - sx;
      const dy = ty - sy;

      if (layoutMode === "LANES" || Math.abs(dx) > Math.abs(dy) * 0.5) {
        const mx = (sx + tx) / 2;
        return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
      } else {
        const my = (sy + ty) / 2;
        return `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`;
      }
    };

    // Draw Links as smooth curved paths
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(linksData)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => (d.isHiddenConnection ? "#a855f7" : "#3b82f6"))
      .attr("stroke-width", (d: any) => (d.isHiddenConnection ? 2 : 1.6))
      .attr("stroke-dasharray", (d: any) => (d.isHiddenConnection ? "5,4" : "0"))
      .attr("stroke-opacity", 0.75)
      .attr("marker-end", (d: any) =>
        d.isHiddenConnection ? "url(#arrow-dashed)" : "url(#arrow-solid)"
      )
      .style("cursor", "pointer")
      .on("click", (_event, d: any) => {
        setSelectedEdge(d);
        setSelectedNode(null);
      });

    // Native hover tooltip for links
    link
      .append("title")
      .text(
        (d: any) =>
          `${d.relationType.replace(/_/g, " ")}${
            d.isHiddenConnection ? " (Inferred Hidden Link)" : " (Direct Link)"
          } - Click to inspect evidence`
      );

    // Draw Nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodesData)
      .enter()
      .append("g")
      .attr("class", "graph-node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", function (_event, d: any) {
        setSelectedNode(d);
        setSelectedEdge(null);

        // Visual selection indicator ring
        g.selectAll(".node-selection-ring").remove();
        d3.select(this)
          .append("circle")
          .attr("class", "node-selection-ring")
          .attr("r", 24)
          .attr("fill", "none")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "3,3");
      });

    // Node hover tooltip
    node
      .append("title")
      .text(
        (d: any) =>
          `${d.name} (${d.type})\nRole: ${d.role || "N/A"}\nClick to view full dossier & connected reasoning`
      );

    // Render DISTINCT GEOMETRIC SHAPES & ICON SILHOUETTES for each entity type:
    node.each(function (d: any) {
      const el = d3.select(this);
      const isLeader = d.isKeyInfluencer || (d.centralityScore || 0) >= 0.8;

      // Outer aura ring for key influencers
      if (isLeader) {
        el.append("circle")
          .attr("r", 23)
          .attr("fill", "none")
          .attr("stroke", getNodeColor(d.type))
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.65);
      }

      switch (d.type) {
        case "PERSON": {
          // Suspect: Emerald Circle with Person Avatar silhouette
          el.append("circle")
            .attr("r", isLeader ? 17 : 14)
            .attr("fill", "#064e3b")
            .attr("stroke", "#10b981")
            .attr("stroke-width", 2.2);

          // Head & Shoulders
          el.append("circle")
            .attr("cx", 0)
            .attr("cy", -3)
            .attr("r", 3.2)
            .attr("fill", "#6ee7b7");
          el.append("path")
            .attr("d", "M -6 6 C -6 2, 6 2, 6 6 Z")
            .attr("fill", "#6ee7b7");
          break;
        }

        case "ORGANIZATION": {
          // Shell Company / Org: Royal Blue Rounded Square with Building Facade
          const s = isLeader ? 15 : 12.5;
          el.append("rect")
            .attr("x", -s)
            .attr("y", -s)
            .attr("width", s * 2)
            .attr("height", s * 2)
            .attr("rx", 4)
            .attr("fill", "#1e3a8a")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2.2);

          // Building pediment roof + columns + base
          el.append("path")
            .attr("d", "M -8 -3 L 0 -8 L 8 -3 Z")
            .attr("fill", "#93c5fd");
          el.append("rect").attr("x", -6).attr("y", -2).attr("width", 2.2).attr("height", 6).attr("fill", "#93c5fd");
          el.append("rect").attr("x", -1.1).attr("y", -2).attr("width", 2.2).attr("height", 6).attr("fill", "#93c5fd");
          el.append("rect").attr("x", 3.8).attr("y", -2).attr("width", 2.2).attr("height", 6).attr("fill", "#93c5fd");
          el.append("rect").attr("x", -8).attr("y", 4.5).attr("width", 16).attr("height", 1.5).attr("fill", "#93c5fd");
          break;
        }

        case "LOCATION": {
          // Safehouse / Hub / Port: Amber Diamond with Map Pin
          el.append("polygon")
            .attr("points", isLeader ? "0,-18 18,0 0,18 -18,0" : "0,-15 15,0 0,15 -15,0")
            .attr("fill", "#78350f")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2.2);

          // Map pin glyph
          el.append("path")
            .attr(
              "d",
              "M 0 -6 C -3.5 -6 -5 -3.5 -5 0 C -5 3.5 0 7 0 7 C 0 7 5 3.5 5 0 C 5 -3.5 3.5 -6 0 -6 Z M 0 -1 C -1.2 -1 -2 -1.8 -2 -3 C -2 -4.2 -1.2 -5 0 -5 C 1.2 -5 2 -4.2 2 -3 C 2 -1.8 1.2 -1 0 -1 Z"
            )
            .attr("fill", "#fcd34d");
          break;
        }

        case "PHONE": {
          // Phone / MSISDN: Cyan Smartphone Pill with Screen & Home Button
          el.append("rect")
            .attr("x", -9)
            .attr("y", -14)
            .attr("width", 18)
            .attr("height", 28)
            .attr("rx", 5)
            .attr("fill", "#164e63")
            .attr("stroke", "#06b6d4")
            .attr("stroke-width", 2.2);

          // Screen
          el.append("rect")
            .attr("x", -6.5)
            .attr("y", -10)
            .attr("width", 13)
            .attr("height", 16)
            .attr("rx", 1.5)
            .attr("fill", "#0891b2")
            .attr("fill-opacity", 0.6);
          // Home button
          el.append("circle")
            .attr("cx", 0)
            .attr("cy", 9.5)
            .attr("r", 1.2)
            .attr("fill", "#cffafe");
          break;
        }

        case "FINANCIAL_ACCOUNT": {
          // Hawala / Wire Account: Golden Yellow Security Shield with Currency Symbol
          el.append("path")
            .attr(
              "d",
              "M 0 -15 L 13 -10 L 13 2 C 13 9, 0 15, 0 15 C 0 15, -13 9, -13 2 L -13 -10 Z"
            )
            .attr("fill", "#713f12")
            .attr("stroke", "#eab308")
            .attr("stroke-width", 2.2);

          // Currency $ glyph
          el.append("text")
            .attr("x", 0)
            .attr("y", 3.5)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("font-family", "monospace")
            .attr("font-weight", "bold")
            .attr("fill", "#fef08a")
            .text("$");
          break;
        }

        case "VEHICLE": {
          // Vehicle / Container: Purple Cargo Container with Wheels
          el.append("rect")
            .attr("x", -15)
            .attr("y", -9)
            .attr("width", 30)
            .attr("height", 18)
            .attr("rx", 3.5)
            .attr("fill", "#581c87")
            .attr("stroke", "#a855f7")
            .attr("stroke-width", 2.2);

          // Cab window & wheels
          el.append("path")
            .attr("d", "M -10 0 L -6 -6 L 4 -6 L 8 0 Z")
            .attr("fill", "#e9d5ff");
          el.append("circle").attr("cx", -6).attr("cy", 5).attr("r", 2).attr("fill", "#f3e8ff");
          el.append("circle").attr("cx", 6).attr("cy", 5).attr("r", 2).attr("fill", "#f3e8ff");
          break;
        }

        case "WEAPON": {
          // Weapon / Arms: Crimson Hazard Triangle with Crosshair Target
          el.append("polygon")
            .attr("points", "0,-15 15,11 -15,11")
            .attr("fill", "#7f1d1d")
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 2.2);

          // Crosshair target
          el.append("circle")
            .attr("cx", 0)
            .attr("cy", 1)
            .attr("r", 3.8)
            .attr("fill", "none")
            .attr("stroke", "#fecaca")
            .attr("stroke-width", 1.2);
          el.append("line").attr("x1", 0).attr("y1", -4).attr("x2", 0).attr("y2", 6).attr("stroke", "#fecaca").attr("stroke-width", 1.2);
          el.append("line").attr("x1", -5).attr("y1", 1).attr("x2", 5).attr("y2", 1).attr("stroke", "#fecaca").attr("stroke-width", 1.2);
          break;
        }

        default: {
          el.append("circle")
            .attr("r", 12)
            .attr("fill", "#1e293b")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 2);
          break;
        }
      }

      // Critical Threat Indicator
      if (d.threatLevel === "CRITICAL") {
        el.append("circle")
          .attr("cx", 11)
          .attr("cy", -11)
          .attr("r", 4)
          .attr("fill", "#ef4444")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.2);
      }
    });

    // Small, Compact, Crisp Node Label (9px, clean dark outline halo)
    node
      .append("text")
      .attr("dy", 24)
      .attr("text-anchor", "middle")
      .attr("font-size", 9)
      .attr("font-family", "Plus Jakarta Sans, system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("letter-spacing", "0.015em")
      .attr("fill", "#e2e8f0")
      .style("paint-order", "stroke fill")
      .style("stroke", "#0a0f17")
      .style("stroke-width", "3.5px")
      .style("stroke-linejoin", "round")
      .style("user-select", "none")
      .text((d: any) => (d.name.length > 22 ? d.name.slice(0, 20) + "…" : d.name));

    // Function to synchronize node and link positions
    const updatePositions = () => {
      link.attr("d", computeLinkPath);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    };

    // Update positions on simulation tick
    simulation.on("tick", () => {
      updatePositions();
    });

    // Permanently freeze all nodes once initial animation completes
    const freezeGraph = () => {
      simulation.stop();
      nodesData.forEach((d: any) => {
        d.fx = d.x;
        d.fy = d.y;
      });
      updatePositions();
      setIsStationary(true);
      setTimeout(() => {
        handleFitView(true);
      }, 80);
    };

    simulation.on("end", freezeGraph);

    // In LANES mode, freeze immediately for crisp stationary view
    const freezeTimeout = layoutMode === "LANES" ? 150 : 1000;
    const freezeTimer = setTimeout(() => {
      freezeGraph();
    }, freezeTimeout);

    // Stationary drag handlers: reposition targeted node cleanly without disturbing others
    function dragstarted(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
      event.subject.x = event.x;
      event.subject.y = event.y;
      updatePositions();
    }

    function dragended(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
      updatePositions();
    }

    return () => {
      clearTimeout(freezeTimer);
      simulation.stop();
    };
  }, [finalNetwork, searchQuery, selectedType, showHiddenOnly, layoutTrigger, layoutMode]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 0.75);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const handleFitView = (animate: boolean = true) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !gRef.current || !containerRef.current) return;
    const gEl = gRef.current.node() as SVGGElement | null;
    if (!gEl) return;
    const bbox = gEl.getBBox();
    if (!bbox || bbox.width === 0 || bbox.height === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const padding = 65;
    const scale = Math.min(
      (width - padding * 2) / bbox.width,
      (height - padding * 2) / bbox.height,
      1.2
    );

    const midX = bbox.x + bbox.width / 2;
    const midY = bbox.y + bbox.height / 2;
    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

    const sel = d3.select(svgRef.current);
    if (animate) {
      sel.transition().duration(450).call(zoomBehaviorRef.current.transform, transform);
    } else {
      sel.call(zoomBehaviorRef.current.transform, transform);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        handleFitView(true);
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Controls */}
      <div className="bg-[#121927] border border-[#1f2c42] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <Share2 className="w-4 h-4" />
              <span>STAGE 7 & 8 // INTERACTIVE CRIMINAL NETWORK GRAPH & EXPLAINABLE EVIDENCE</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Topological Syndicate Graph & Evidence Provenance Inspector
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Synthesized by the Second Fine-Tuned LLM from multiple verified case documents. Click any entity node to inspect dossier attributes, or click any relationship edge to examine the exact source document quote, forensic rationale, and confidence score.
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suspects, aliases, phones..."
                className="pl-8 pr-3 py-1.5 bg-[#0d131f] border border-[#202d41] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52"
              />
            </div>

            {/* Type Selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#0d131f] border border-[#202d41] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Entity Types</option>
              <option value="PERSON">Persons / Suspects</option>
              <option value="ORGANIZATION">Organizations / Shells</option>
              <option value="LOCATION">Locations / Hubs</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="PHONE">Phones / MSISDNs</option>
              <option value="WEAPON">Weapons</option>
              <option value="FINANCIAL_ACCOUNT">Hawala / Accounts</option>
            </select>

            {/* Hidden Links Toggle */}
            <button
              onClick={() => setShowHiddenOnly(!showHiddenOnly)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition flex items-center gap-1.5 ${
                showHiddenOnly
                  ? "bg-purple-600/30 text-purple-300 border-purple-500"
                  : "bg-[#0d131f] text-slate-400 border-[#202d41] hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Hidden Links Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Side Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph SVG Canvas (8 cols) */}
        <div
          ref={containerRef}
          className={`${
            isFullscreen
              ? "fixed inset-0 z-50 bg-[#070b12] p-4 flex flex-col justify-between"
              : "lg:col-span-8 bg-[#0a0f17] border border-[#1d293d] rounded-lg relative overflow-hidden flex flex-col justify-between h-[620px]"
          }`}
        >
          {/* Zoom, status, load, and canvas controls overlay */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#101724]/90 backdrop-blur border border-[#1e2a3c] p-1.5 rounded-lg shadow-xl">
            {/* Status indicator */}
            <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono border-r border-[#1e2a3c] mr-0.5">
              {isStationary ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Stationary</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Arranging...</span>
                </span>
              )}
            </div>

            {/* Layout Mode Toggle: Flow Lanes (Clean, No Criss-Crossing) vs Concentric */}
            <div className="flex items-center bg-[#0c121e] p-0.5 rounded border border-[#1e2a3c] text-[10px] font-mono mr-1">
              <button
                onClick={() => setLayoutMode("LANES")}
                className={`px-2 py-1 rounded transition ${
                  layoutMode === "LANES"
                    ? "bg-blue-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Structured Flow Lanes (Clean intelligence flow, zero criss-crossing)"
              >
                Flow Lanes
              </button>
              <button
                onClick={() => setLayoutMode("RINGS")}
                className={`px-2 py-1 rounded transition ${
                  layoutMode === "RINGS"
                    ? "bg-blue-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Concentric Radial Rings (Kingpins at center)"
              >
                Concentric
              </button>
            </div>

            {/* Load latest network data from server */}
            {onReloadNetwork && (
              <button
                onClick={() => onReloadNetwork()}
                disabled={isLoading}
                className="px-2 py-1 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition flex items-center gap-1 text-xs font-mono disabled:opacity-50"
                title="Load latest syndicate network from server"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
                <span>Load</span>
              </button>
            )}

            {/* Re-align / Organize Layout */}
            <button
              onClick={() => setLayoutTrigger((prev) => prev + 1)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition flex items-center gap-1 text-xs font-mono"
              title="Re-organize Layout"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Organize</span>
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Fit to Screen */}
            <button
              onClick={() => handleFitView(true)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition"
              title="Fit Network to Screen"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Reset Scale to 100% */}
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1a2537] rounded transition"
              title="Reset Zoom to 100%"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Full Screen */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded transition ${
                isFullscreen
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/60"
                  : "text-slate-300 hover:text-white hover:bg-[#1a2537]"
              }`}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Fullscreen Floating Inspector Modal if an entity or relationship is clicked while in Fullscreen */}
          {isFullscreen && (selectedNode || selectedEdge) && (
            <div className="absolute top-16 right-4 z-20 w-96 max-h-[calc(100vh-6rem)] bg-[#101726]/95 backdrop-blur border border-[#1e2a3c] rounded-xl p-4 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b2638] mb-3">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                  {selectedNode ? "Entity Dossier" : "Relationship Forensic"}
                </span>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setSelectedEdge(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#172233]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedNode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#172233] text-slate-300">
                      {selectedNode.type}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-red-400">
                      THREAT: {selectedNode.threatLevel || "ELEVATED"}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">{selectedNode.name}</div>
                  <div className="text-xs text-slate-400">{selectedNode.role}</div>
                  <div className="text-xs font-mono text-emerald-400">
                    Centrality: {((selectedNode.centralityScore || 0.5) * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {selectedEdge && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-white">
                    {selectedEdge.relationType.replace(/_/g, " ")}
                  </div>
                  {selectedEdge.evidence?.[0]?.reasoning && (
                    <div className="text-xs text-slate-300 bg-[#0a0f18] p-2.5 rounded border border-[#1a2537]">
                      {selectedEdge.evidence[0].reasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Topological Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-[#0e1422]/92 backdrop-blur border border-[#1c2738] p-2.5 rounded-lg text-[10px] font-mono text-slate-300 space-y-1.5 shadow-lg max-w-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Visual Entity Legend
              </span>
              <span className="text-[9px] text-slate-500">Distinct Shapes & Glyphs</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#064e3b] border border-[#10b981] flex items-center justify-center text-[7px] text-[#6ee7b7]">●</span>
                <span>Person</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#1e3a8a] border border-[#3b82f6] flex items-center justify-center text-[7px] text-[#93c5fd]">■</span>
                <span>Shell Org</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rotate-45 rounded-[1px] bg-[#78350f] border border-[#f59e0b] flex items-center justify-center text-[7px] text-[#fcd34d]">♦</span>
                <span>Location</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-4 rounded-[3px] bg-[#164e63] border border-[#06b6d4] flex items-center justify-center text-[7px] text-[#cffafe]">▯</span>
                <span>Phone / SIM</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-[#713f12] border border-[#eab308] flex items-center justify-center text-[8px] font-bold text-[#fef08a]">$</span>
                <span>Hawala Acct</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded-sm bg-[#581c87] border border-[#a855f7] flex items-center justify-center text-[7px] text-[#f3e8ff]">▭</span>
                <span>Vehicle</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#7f1d1d] border border-[#ef4444] flex items-center justify-center text-[7px] text-[#fecaca]">▲</span>
                <span>Weapon</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-red-400 font-bold">Critical</span>
              </span>
            </div>
            <div className="flex items-center gap-4 pt-1 border-t border-[#182333]">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-400"></span> Direct Link
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-purple-400"></span> Inferred Hidden Link
              </span>
            </div>
          </div>

          {/* SVG Container */}
          {!finalNetwork || finalNetwork.nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No network generated yet. Execute Second LLM Reasoning stage.
            </div>
          ) : (
            <svg ref={svgRef} className="w-full h-full" />
          )}
        </div>

        {/* Right Inspector & Key Influencers Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-[#121927] border border-[#1f2c42] rounded-lg p-5 flex flex-col justify-between overflow-y-auto max-h-[600px]">
          {/* If an Edge is selected: Display Explainable Evidence */}
          {selectedEdge ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2638] pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Explainable Relationship
                </span>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[#0d131f] border border-[#1e2a3c] rounded-lg">
                <div className="text-[10px] font-mono text-purple-400 uppercase font-semibold">
                  {selectedEdge.isHiddenConnection ? "Deep Pattern / Indirect Inferred Link" : "Direct Statement Link"}
                </div>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {finalNetwork?.nodes.find((n) => n.id === selectedEdge.sourceId)?.name} &rarr;{" "}
                  <span className="text-blue-400 font-mono text-xs">{selectedEdge.relationType}</span> &rarr;{" "}
                  {finalNetwork?.nodes.find((n) => n.id === selectedEdge.targetId)?.name}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1 font-semibold">
                  Confidence Score: {(selectedEdge.confidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Supporting Quotes */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Supporting Document Evidence Quotes
                </div>
                {selectedEdge.evidence && selectedEdge.evidence.length > 0 ? (
                  selectedEdge.evidence.map((ev, i) => (
                    <div key={i} className="p-3 bg-[#0a0f18] border border-[#192435] rounded space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-blue-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {ev.sourceDocumentName}
                        </span>
                        <span className="text-slate-500">{ev.sourceDocumentId}</span>
                      </div>
                      <div className="p-2 bg-[#121927] border border-[#192334] rounded italic text-slate-200 text-[11px] leading-relaxed">
                        "{ev.quoteExcerpt}"
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <strong className="text-purple-300 font-mono">Reasoning:</strong> {ev.reasoning}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#0a0f18] border border-[#192435] rounded text-slate-400 text-xs">
                    Derived from multi-source cross analysis.
                  </div>
                )}
              </div>
            </div>
          ) : selectedNode ? (
            /* If a Node is selected: Display Entity Dossier */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2638] pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Suspect / Entity Dossier
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-[#0d131f] border border-[#1e2a3c] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#172233] text-slate-300">
                    {selectedNode.type}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      selectedNode.threatLevel === "CRITICAL"
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : selectedNode.threatLevel === "HIGH"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}
                  >
                    THREAT: {selectedNode.threatLevel || "ELEVATED"}
                  </span>
                </div>

                <div className="text-base font-bold text-slate-100 mt-2">
                  {selectedNode.name}
                </div>
                {selectedNode.aliases && selectedNode.aliases.length > 0 && (
                  <div className="text-xs text-purple-300 font-mono mt-0.5">
                    Aliases: {selectedNode.aliases.join(", ")}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1 font-medium">
                  {selectedNode.role}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#182333] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Network Centrality:</span>
                  <span className="text-emerald-400 font-bold">
                    {((selectedNode.centralityScore || 0.5) * 100).toFixed(0)} / 100
                  </span>
                </div>
              </div>

              {/* Attributes */}
              {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                    Associated Intelligence Attributes
                  </div>
                  <div className="p-3 bg-[#0a0f18] border border-[#192435] rounded space-y-1">
                    {Object.entries(selectedNode.attributes).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-0.5 border-b border-[#141d2a]">
                        <span className="text-slate-400 capitalize">{key}:</span>
                        <span className="text-slate-200 font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Relationships & Reasoning */}
              {(() => {
                const connectedEdges = (finalNetwork?.edges || []).filter(
                  (e) => e.sourceId === selectedNode.id || e.targetId === selectedNode.id
                );

                if (connectedEdges.length === 0) return null;

                return (
                  <div className="space-y-2 mt-4 pt-3 border-t border-[#1b2638]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Share2 className="w-3 h-3 text-blue-400" />
                        Network Links & Reasoning ({connectedEdges.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {connectedEdges.map((edge) => {
                        const isSource = edge.sourceId === selectedNode.id;
                        const otherNodeId = isSource ? edge.targetId : edge.sourceId;
                        const otherNode = finalNetwork?.nodes.find((n) => n.id === otherNodeId);
                        const topEvidence = edge.evidence?.[0];

                        return (
                          <div
                            key={edge.id}
                            onClick={() => setSelectedEdge(edge)}
                            className="p-3 bg-[#0d131f] hover:bg-[#152030] border border-[#1e2a3c] hover:border-blue-500/50 rounded-lg cursor-pointer transition text-xs space-y-2 group"
                            title="Click to inspect isolated evidence"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {isSource ? "→ Outgoing to:" : "← Inbound from:"}
                                </span>
                                <span className="text-blue-300 group-hover:underline">
                                  {otherNode?.name || otherNodeId}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                  edge.isHiddenConnection
                                    ? "bg-purple-950/60 text-purple-300 border-purple-800/60"
                                    : "bg-blue-950/60 text-blue-300 border-blue-800/60"
                                }`}
                              >
                                {edge.isHiddenConnection ? "HIDDEN INFERRED" : "DIRECT"}
                              </span>
                            </div>

                            <div className="font-mono text-[11px] text-blue-400">
                              Relation: {edge.relationType.replace(/_/g, " ")}
                            </div>

                            {topEvidence?.reasoning && (
                              <div className="text-[11px] text-slate-300 bg-[#090d15] p-2.5 rounded border border-[#162030] leading-relaxed">
                                <div className="text-purple-300 font-semibold font-mono text-[10px] mb-1 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-400" />
                                  LLM Reasoning & Inference:
                                </div>
                                {topEvidence.reasoning}
                              </div>
                            )}

                            {topEvidence?.quoteExcerpt && (
                              <div className="text-[10px] text-slate-400 italic bg-[#070b12] p-2 rounded border border-[#131b27]">
                                <span className="text-slate-500 not-italic font-mono text-[9px] block">
                                  Source: {topEvidence.sourceDocumentName || topEvidence.sourceDocumentId}
                                </span>
                                "{topEvidence.quoteExcerpt}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Default: Key Influencer Leaderboard */
            <div className="space-y-4">
              <div className="border-b border-[#1b2638] pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  Key Influencers & Central Nodes
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Algorithmically ranked by graph degree, betweenness centrality, and threat rating.
                </p>
              </div>

              <div className="space-y-2">
                {(finalNetwork?.networkMetrics.keyInfluencers || []).map((inf, idx) => (
                  <div
                    key={inf.entityId}
                    onClick={() => {
                      const n = finalNetwork?.nodes.find((node) => node.id === inf.entityId);
                      if (n) setSelectedNode(n);
                    }}
                    className="p-3 bg-[#0d131f] hover:bg-[#152030] border border-[#1c2738] rounded text-xs cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#182436] text-blue-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">{inf.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inf.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {(inf.score * 100).toFixed(0)}%
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">Centrality</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#0a0f18] border border-[#1a2537] rounded text-[11px] text-slate-400 leading-relaxed">
                Click any node or relationship link in the graph canvas to inspect full forensic evidence quotes.
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#1b2638] text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Total Nodes: {finalNetwork?.nodes.length || 0}</span>
            <span>Verified Edges: {finalNetwork?.edges.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
