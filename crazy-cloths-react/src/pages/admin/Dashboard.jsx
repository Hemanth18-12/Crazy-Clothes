import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalUsers: 0,
    totalProducts: 0
  });

  const [trends, setTrends] = useState({
    ordersDiff: 0,
    ordersPct: 0,
    todayDiff: 0,
    todayPct: 0,
    usersThisWeek: 0,
    usersPct: 0
  });

  const [sparklines, setSparklines] = useState({
    totalOrders: [0, 0, 0, 0, 0, 0, 0],
    todayOrders: [0, 0],
    totalUsers: [0, 0, 0, 0, 0, 0, 0],
    totalProducts: [0, 0, 0, 0, 0, 0, 0]
  });

  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ Pending: 0, Confirmed: 0, Dispatched: 0, Delivered: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  // Live Now — online users
  const [liveUsers, setLiveUsers] = useState([]);

  // Revenue analytics
  const [revenue, setRevenue] = useState({
    total: 0, thisWeek: 0, lastWeek: 0, avgOrder: 0, change: 0, bestDay: { date: '', amount: 0 }
  });

  // Most Wishlisted products leaderboard
  const [mostWishlisted, setMostWishlisted] = useState([]);

  const weeklyChartRef = useRef(null);
  const productsChartRef = useRef(null);

  useEffect(() => {
    document.title = 'Crazy Cloths — Admin Dashboard';
  }, []);

  // Fetch real-time statistics
  useEffect(() => {
    // 1. Listen to Activity Feed
    const activityQuery = query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setActivityFeed(logs);
    });

    // 2. Fetch products and check stock
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const totalProds = querySnapshot.size;
        const lowStock = [];
        querySnapshot.forEach((doc) => {
          const p = doc.data();
          if (p.stockCount !== undefined && p.stockCount !== null && p.stockCount <= 5) {
            lowStock.push({ id: doc.id, ...p });
          }
        });
        setStats((prev) => ({ ...prev, totalProducts: totalProds }));
        setLowStockAlerts(lowStock);
        setSparklines((prev) => ({
          ...prev,
          totalProducts: Array(7).fill(totalProds)
        }));
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();

    // 3. Fetch users and user trends
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const totalU = querySnapshot.size;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let usersWeekCount = 0;
        querySnapshot.forEach((doc) => {
          const u = doc.data();
          if (u.createdAt) {
            const uDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
            if (uDate >= sevenDaysAgo) {
              usersWeekCount++;
            }
          }
        });
        
        const usersTrendPct = Math.round((usersWeekCount / Math.max(1, totalU)) * 100);
        setStats((prev) => ({ ...prev, totalUsers: totalU }));
        setTrends((prev) => ({ ...prev, usersThisWeek: usersWeekCount, usersPct: usersTrendPct }));
        setSparklines((prev) => ({
          ...prev,
          totalUsers: Array(7).fill(0).map((_, i) => Math.max(1, Math.round(totalU - (7 - i) * 0.5)))
        }));
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();

    // 4. Real-time orders, trends, and charts calculations
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      const totalOrd = orders.length;
      setStats((prev) => ({ ...prev, totalOrders: totalOrd }));

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let todayCount = 0;
      let yesterdayCount = 0;
      const recOrders = [];
      const statusC = { Pending: 0, Confirmed: 0, Dispatched: 0, Delivered: 0 };
      const weeklyCounts = Array(7).fill(0); // Sun - Sat counts
      const prodTypeCounts = {};

      // Daily counts for sparkline
      const sparklineDates = Array(7).fill("").map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      const dailyCounts = Array(7).fill(0);

      orders.forEach((order) => {
        const status = order.status || 'Pending';
        statusC[status] = (statusC[status] || 0) + 1;

        if (order.createdAt) {
          const datePart = order.createdAt.split('T')[0];

          if (datePart === todayStr) {
            todayCount++;
          } else if (datePart === yesterdayStr) {
            yesterdayCount++;
          }

          const dateIdx = sparklineDates.indexOf(datePart);
          if (dateIdx !== -1) {
            dailyCounts[dateIdx]++;
          }

          // Weekly distribution (Sun - Sat)
          const orderDate = new Date(order.createdAt);
          const daysDiff = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 7) {
            weeklyCounts[orderDate.getDay()]++;
          }

          // Top product types
          const type = order.productName || 'T-Shirt';
          prodTypeCounts[type] = (prodTypeCounts[type] || 0) + (order.quantity || 1);
        }

        if (recOrders.length < 10) {
          recOrders.push(order);
        }
      });

      setStats((prev) => ({ ...prev, todayOrders: todayCount }));
      setRecentOrders(recOrders);
      setStatusCounts(statusC);
      setSparklines((prev) => ({
        ...prev,
        totalOrders: dailyCounts,
        todayOrders: [yesterdayCount, todayCount]
      }));

      // Trends: Today vs Yesterday
      const tDiff = todayCount - yesterdayCount;
      const tPct = yesterdayCount > 0 ? Math.round((tDiff / yesterdayCount) * 100) : todayCount * 100;
      setTrends((prev) => ({ ...prev, todayDiff: tDiff, todayPct: tPct }));

      // Trends: Total Orders This Week vs Last Week
      let weekOrders = 0;
      let lastWeekOrders = 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      orders.forEach((o) => {
        if (o.createdAt) {
          const oDate = new Date(o.createdAt);
          if (oDate >= sevenDaysAgo) {
            weekOrders++;
          } else if (oDate >= fourteenDaysAgo) {
            lastWeekOrders++;
          }
        }
      });

      const oDiff = weekOrders - lastWeekOrders;
      const oPct = lastWeekOrders > 0 ? Math.round((oDiff / lastWeekOrders) * 100) : weekOrders * 100;
      setTrends((prev) => ({ ...prev, ordersDiff: oDiff, ordersPct: oPct }));

      // Heatmap Data (Last 12 Weeks)
      const daysToShow = 84;
      const counts = {};
      const now = new Date();
      for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const yyyymmdd = d.toISOString().split('T')[0];
        counts[yyyymmdd] = { date: d, count: 0 };
      }

      orders.forEach((o) => {
        if (o.createdAt) {
          const yyyymmdd = o.createdAt.split('T')[0];
          if (counts[yyyymmdd]) {
            counts[yyyymmdd].count++;
          }
        }
      });

      const keys = Object.keys(counts);
      const weeks = [];
      for (let w = 0; w < 12; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
          const idx = w * 7 + d;
          if (idx < keys.length) {
            week.push(counts[keys[idx]]);
          }
        }
        weeks.push(week);
      }
      setHeatmapData(weeks);

      // Draw weekly chart
      drawWeeklyChart(weeklyCounts);

      // Draw product charts
      drawProductsChart(prodTypeCounts);
    });

    // 5. Live presence — who is online
    const unsubscribePresence = onSnapshot(collection(db, 'presence'), (snap) => {
      const users = [];
      snap.forEach((d) => users.push({ id: d.id, ...d.data() }));
      setLiveUsers(users);
    });

    // 6. Revenue analytics from orders collection
    const unsubscribeRevenue = onSnapshot(collection(db, 'orders'), (snap) => {
      const orders = snap.docs.map((d) => ({
        ...d.data(),
        _parsedDate: d.data().createdAt
          ? (d.data().createdAt.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt))
          : null
      }));

      const now = new Date();
      const weekAgo = new Date(now - 7 * 86400000);
      const twoWeeksAgo = new Date(now - 14 * 86400000);

      const totalRevenue = orders.reduce((s, o) => s + (Number(o.price) || 0), 0);
      const thisWeekOrders = orders.filter((o) => o._parsedDate && o._parsedDate >= weekAgo);
      const lastWeekOrders = orders.filter((o) => o._parsedDate && o._parsedDate >= twoWeeksAgo && o._parsedDate < weekAgo);
      const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);
      const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const revenueChange = lastWeekRevenue > 0
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
        : (thisWeekRevenue > 0 ? 100 : 0);

      // Best day
      const dailyTotals = {};
      orders.forEach((o) => {
        if (!o._parsedDate) return;
        const dayKey = o._parsedDate.toISOString().split('T')[0];
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + (Number(o.price) || 0);
      });
      let bestDay = { date: '', amount: 0 };
      Object.entries(dailyTotals).forEach(([date, amount]) => {
        if (amount > bestDay.amount) bestDay = { date, amount };
      });

      setRevenue({ total: totalRevenue, thisWeek: thisWeekRevenue, lastWeek: lastWeekRevenue, avgOrder: avgOrderValue, change: revenueChange, bestDay });
    });

    // 7. Most Wishlisted products leaderboard
    const wishQ = query(collection(db, 'products'), orderBy('wishlistCount', 'desc'), limit(5));
    const unsubscribeWishlist = onSnapshot(wishQ, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setMostWishlisted(items);
    });

    return () => {
      unsubscribeActivity();
      unsubscribeOrders();
      unsubscribePresence();
      unsubscribeRevenue();
      unsubscribeWishlist();
    };
  }, []);

  const drawWeeklyChart = (counts) => {
    const canvas = weeklyChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 300;
    canvas.width = width;
    canvas.height = 240;

    const height = 240;
    const padding = 35;

    ctx.fillStyle = '#111111'; // Pure flat black card surface background
    ctx.fillRect(0, 0, width, height);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const orderedDays = [];
    const orderedData = [];
    for (let i = 6; i >= 0; i--) {
      const d = (today - i + 7) % 7;
      orderedDays.push(days[d]);
      orderedData.push(counts[d]);
    }

    const maxVal = Math.max(...orderedData, 5);

    ctx.strokeStyle = '#222222'; // Premium border color
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const barCount = 7;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const spacing = 15;
    const barWidth = (chartWidth / barCount) - spacing;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (orderedData[i] / maxVal) * chartHeight;
      const x = padding + i * (barWidth + spacing) + spacing / 2;
      const y = height - padding - barHeight;

      // Premium Red gradient on bars
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#FF1A1A');
      gradient.addColorStop(1, '#CC0000');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#888888';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(orderedDays[i], x + barWidth / 2, height - padding + 15);

      ctx.fillStyle = '#F0F0F0';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(orderedData[i], x + barWidth / 2, y - 6);
    }
  };

  const drawProductsChart = (data) => {
    const canvas = productsChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 300;
    canvas.width = width;
    canvas.height = 240;

    const height = 240;
    const padding = 35;

    ctx.fillStyle = '#111111'; // Pure flat black card surface background
    ctx.fillRect(0, 0, width, height);

    const items = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (items.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No product sales data yet.', width / 2, height / 2);
      return;
    }

    const maxVal = Math.max(...items.map((item) => item[1]), 1);
    const chartWidth = width - padding * 2.8;
    const chartHeight = height - padding * 2;
    const barHeight = Math.min(22, chartHeight / 4 - 10);
    const gap = (chartHeight - barHeight * items.length) / (items.length - 1 || 1);

    items.forEach((item, i) => {
      const label = item[0];
      const val = item[1];
      const barWidth = (val / maxVal) * chartWidth;
      const x = padding + 70;
      const y = padding + i * (barHeight + gap);

      // Premium Red gradient on bars
      const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
      gradient.addColorStop(0, '#FF1A1A');
      gradient.addColorStop(1, '#CC0000');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#F0F0F0';
      ctx.font = '9px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(label.length > 10 ? label.slice(0, 8) + '...' : label, x - 10, y + barHeight / 2 + 3);

      ctx.fillStyle = '#F0F0F0';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(val, x + barWidth + 8, y + barHeight / 2 + 3);
    });
  };

  const drawSparklineSvg = (pointsArray) => {
    const max = Math.max(...pointsArray, 2);
    const width = 100;
    const height = 30;
    const points = pointsArray.map((val, index) => {
      const x = (index / (pointsArray.length - 1)) * width;
      const y = height - ((val / max) * (height - 6)) - 3;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L 100 30 L 0 30 Z`;

    return { linePath, areaPath };
  };

  const getRelativeTimeString = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return 'just now';
  };

  const handleMouseMove = (e) => {
    if (tooltip.visible) {
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX + 10,
        y: e.clientY + 10
      }));
    }
  };

  const showTooltip = (e, text) => {
    setTooltip({
      visible: true,
      text,
      x: e.clientX + 10,
      y: e.clientY + 10
    });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const totalDonutCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const statuses = [
    { label: 'Pending', color: 'var(--a-yellow)', count: statusCounts.Pending || 0 },
    { label: 'Confirmed', color: 'var(--a-blue)', count: statusCounts.Confirmed || 0 },
    { label: 'Dispatched', color: 'var(--a-purple)', count: statusCounts.Dispatched || 0 },
    { label: 'Delivered', color: 'var(--a-green)', count: statusCounts.Delivered || 0 }
  ];

  let cumulativePercent = 0;

  return (
    <AdminLayout title="Dashboard">
      <div onMouseMove={handleMouseMove} style={{ outline: 'none' }}>
        {/* STATS CARDS ROW */}
        <div className="admin-stats-row">
          {/* Card 1 — Total Orders */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Orders</span>
              <span className="admin-stat-icon">📦</span>
            </div>
            <div className="admin-stat-value">{stats.totalOrders}</div>
            <div className="admin-stat-trend positive">
              <span style={{ marginRight: '0.2rem' }}>
                {trends.ordersDiff >= 0 ? '↑' : '↓'}
              </span>
              <span>
                {trends.ordersDiff >= 0 ? '+' : ''}
                {trends.ordersPct}%
              </span>{' '}
              <span style={{ color: 'var(--a-text3)', marginLeft: '4px' }}>prev week</span>
            </div>
            <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '30px', pointerEvents: 'none' }} viewBox="0 0 100 30" preserveAspectRatio="none">
              <path fill="rgba(255, 26, 26, 0.04)" d={drawSparklineSvg(sparklines.totalOrders).areaPath}></path>
              <path fill="none" stroke="var(--a-red)" strokeWidth="1.5" d={drawSparklineSvg(sparklines.totalOrders).linePath}></path>
            </svg>
          </div>

          {/* Card 2 — Today's Orders */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Today's Orders</span>
              <span className="admin-stat-icon">🗓️</span>
            </div>
            <div className="admin-stat-value">{stats.todayOrders}</div>
            <div className="admin-stat-trend positive">
              <span style={{ marginRight: '0.2rem' }}>
                {trends.todayDiff >= 0 ? '↑' : '↓'}
              </span>
              <span>
                {trends.todayDiff >= 0 ? '+' : ''}
                {trends.todayPct}%
              </span>{' '}
              <span style={{ color: 'var(--a-text3)', marginLeft: '4px' }}>yesterday</span>
            </div>
            <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '30px', pointerEvents: 'none' }} viewBox="0 0 100 30" preserveAspectRatio="none">
              <path fill="rgba(255, 26, 26, 0.04)" d={drawSparklineSvg(sparklines.todayOrders).areaPath}></path>
              <path fill="none" stroke="var(--a-red)" strokeWidth="1.5" d={drawSparklineSvg(sparklines.todayOrders).linePath}></path>
            </svg>
          </div>

          {/* Card 3 — Total Users */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-icon">👥</span>
            </div>
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-trend positive">
              <span style={{ marginRight: '0.2rem' }}>↑</span>
              <span>
                +{trends.usersThisWeek} (+{trends.usersPct}%)
              </span>{' '}
              <span style={{ color: 'var(--a-text3)', marginLeft: '4px' }}>this week</span>
            </div>
            <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '30px', pointerEvents: 'none' }} viewBox="0 0 100 30" preserveAspectRatio="none">
              <path fill="rgba(255, 26, 26, 0.04)" d={drawSparklineSvg(sparklines.totalUsers).areaPath}></path>
              <path fill="none" stroke="var(--a-red)" strokeWidth="1.5" d={drawSparklineSvg(sparklines.totalUsers).linePath}></path>
            </svg>
          </div>

          {/* Card 4 — Total Products */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Products</span>
              <span className="admin-stat-icon">👕</span>
            </div>
            <div className="admin-stat-value">{stats.totalProducts}</div>
            <div className="admin-stat-trend positive">
              <span style={{ marginRight: '0.2rem' }}>→</span>
              <span>Active</span>{' '}
              <span style={{ color: 'var(--a-text3)', marginLeft: '4px' }}>items</span>
            </div>
            <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '30px', pointerEvents: 'none' }} viewBox="0 0 100 30" preserveAspectRatio="none">
              <path fill="rgba(255, 26, 26, 0.04)" d={drawSparklineSvg(sparklines.totalProducts).areaPath}></path>
              <path fill="none" stroke="var(--a-red)" strokeWidth="1.5" d={drawSparklineSvg(sparklines.totalProducts).linePath}></path>
            </svg>
          </div>

          {/* Card 5 — Live Now */}
          <div className="admin-stat-card" style={{ borderColor: liveUsers.length > 0 ? 'rgba(0, 204, 102, 0.4)' : 'var(--a-border)' }}>
            <style>{`
              @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(0,204,102,0.6); }
                70% { box-shadow: 0 0 0 8px rgba(0,204,102,0); }
                100% { box-shadow: 0 0 0 0 rgba(0,204,102,0); }
              }
            `}</style>
            <div className="admin-stat-header">
              <span className="admin-stat-label">Live Now</span>
              <span className="admin-stat-icon">🟢</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                background: liveUsers.length > 0 ? '#00cc66' : '#444',
                animation: liveUsers.length > 0 ? 'pulse-green 1.5s infinite' : 'none'
              }} />
              <span style={{ fontFamily: 'var(--a-font-display)', fontSize: '2.4rem', color: 'var(--a-text)', lineHeight: 1 }}>
                {liveUsers.length}
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>
              {liveUsers.length === 1 ? 'visitor online' : 'visitors online'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '80px', overflowY: 'auto' }}>
              {liveUsers.length === 0 ? (
                <div style={{ fontSize: '0.62rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)' }}>No visitors right now</div>
              ) : (
                liveUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00cc66', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--a-font-mono)', color: 'var(--a-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {u.name || u.email?.split('@')[0] || 'Customer'}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)', textTransform: 'uppercase', flexShrink: 0 }}>
                      {u.page || 'Browsing'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>


        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {/* Total Revenue */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Total Revenue</span>
              <span className="admin-stat-icon">💰</span>
            </div>
            <div className="admin-stat-value">₹{Math.round(revenue.total).toLocaleString('en-IN')}</div>
            <div className="admin-stat-trend neutral">
              <span>All time</span>
            </div>
          </div>

          {/* This Week Revenue */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">This Week</span>
              <span className="admin-stat-icon">📈</span>
            </div>
            <div className="admin-stat-value">₹{Math.round(revenue.thisWeek).toLocaleString('en-IN')}</div>
            <div className={`admin-stat-trend ${Number(revenue.change) >= 0 ? 'positive' : 'negative'}`}>
              <span>{Number(revenue.change) >= 0 ? '↑' : '↓'} {Math.abs(revenue.change)}%</span>{' '}
              <span style={{ color: 'var(--a-text3)', marginLeft: '4px' }}>vs last week</span>
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Avg Order Value</span>
              <span className="admin-stat-icon">🎯</span>
            </div>
            <div className="admin-stat-value">₹{Math.round(revenue.avgOrder).toLocaleString('en-IN')}</div>
            <div className="admin-stat-trend neutral">
              <span>per order</span>
            </div>
          </div>

          {/* Best Day */}
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span className="admin-stat-label">Best Day</span>
              <span className="admin-stat-icon">🏆</span>
            </div>
            <div className="admin-stat-value">
              {revenue.bestDay.amount > 0 ? `₹${Math.round(revenue.bestDay.amount).toLocaleString('en-IN')}` : '—'}
            </div>
            <div className="admin-stat-trend neutral" style={{ fontSize: '0.6rem' }}>
              {revenue.bestDay.date ? new Date(revenue.bestDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No data yet'}
            </div>
          </div>
        </div>

        {/* LOW STOCK ALERTS NOTIFICATION */}
        {lowStockAlerts.length > 0 && (
          <div
            id="low-stock-alert-container"
            className="admin-card"
            style={{
              background: 'rgba(255, 26, 26, 0.05)',
              borderColor: 'var(--a-red)',
              marginBottom: '28px',
              position: 'relative',
              padding: '20px 40px 20px 20px'
            }}
          >
            <button
              onClick={() => setLowStockAlerts([])}
              style={{
                position: 'absolute',
                top: '12px',
                right: '20px',
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--a-text2)',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              &times;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--a-red)' }}>⚠️</span>
              <h3 className="admin-card-title" style={{ margin: 0, color: 'var(--a-red)' }}>
                Low Stock Alerts
              </h3>
            </div>
            <ul
              id="low-stock-alerts-list"
              style={{
                margin: 0,
                paddingLeft: '1.25rem',
                fontFamily: 'var(--a-font-mono)',
                fontSize: '0.75rem',
                color: 'var(--a-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                textAlign: 'left'
              }}
            >
              {lowStockAlerts.map((p) => (
                <li key={p.id}>
                  Product <strong>{p.name}</strong> ({p.color}, {p.type || 'T-Shirt'}) is low on stock:{' '}
                  <span style={{ color: 'var(--a-red)', fontWeight: 700 }}>{p.stockCount} left</span>.{' '}
                  <Link
                    to="/admin/products"
                    onClick={() => sessionStorage.setItem('cc_scroll_product_id', p.id)}
                    style={{ color: 'var(--a-red)', textDecoration: 'underline', marginLeft: '0.5rem', fontFamily: 'var(--a-font-body)' }}
                  >
                    Update Stock &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* MOST WANTED — Wishlist Leaderboard */}
        <div className="admin-card" style={{ marginBottom: '28px' }}>
          <div className="admin-card-header">
            <div className="admin-card-title">♥ Most Wanted</div>
            <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.62rem', color: 'var(--a-text3)', textTransform: 'uppercase' }}>
              Top Wishlisted Products
            </span>
          </div>
          <div className="admin-card-body">
            {mostWishlisted.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--a-text3)', fontSize: '0.75rem', padding: '20px' }}>
                No wishlist data yet. Wishlist counts update as customers save products.
              </div>
            ) : (() => {
              const maxCount = Math.max(...mostWishlisted.map((p) => p.wishlistCount || 0), 1);
              return mostWishlisted.map((p, i) => {
                const imgSrc = p.imageUrl || (p.color === 'black' ? '/assets/images/black-t-shirt.png' : '/assets/images/white-t-shirt.png');
                const barPct = Math.max(4, Math.round(((p.wishlistCount || 0) / maxCount) * 100));
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#888', '#666'];
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < mostWishlisted.length - 1 ? '1px solid var(--a-border)' : 'none' }}>
                    {/* Rank */}
                    <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.9rem', fontWeight: 700, color: rankColors[i] || '#666', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    {/* Thumbnail */}
                    <img src={imgSrc} alt={p.name} style={{ width: '36px', height: '44px', objectFit: 'cover', border: '1px solid var(--a-border)', flexShrink: 0 }} />
                    {/* Name + Bar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem', color: 'var(--a-text)', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name || 'Unnamed Product'}
                      </div>
                      <div style={{ background: 'var(--a-border)', borderRadius: '2px', height: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: 'var(--a-red)', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                    {/* Count */}
                    <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--a-red)', flexShrink: 0 }}>
                      ♥ {p.wishlistCount || 0}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* CHARTS GRID ROW */}
        <div className="admin-charts-row">

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Orders This Week</div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <canvas ref={weeklyChartRef}></canvas>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Top Product Types</div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <canvas ref={productsChartRef}></canvas>
            </div>
          </div>

          {/* STATUS DISTRIBUTION DONUT */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Status Distribution</div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}>
              <div style={{ position: 'relative', width: '110px', height: '110px', marginBottom: '16px' }}>
                <svg viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--a-border)" strokeWidth="4.2"></circle>
                  <g>
                    {statuses.map((status) => {
                      const percent = totalDonutCount > 0 ? (status.count / totalDonutCount) * 100 : 0;
                      if (percent <= 0) return null;

                      const offset = 100 - cumulativePercent + 25;
                      cumulativePercent += percent;

                      return (
                        <circle
                          key={status.label}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={status.color}
                          strokeWidth="4.2"
                          strokeDasharray={`${percent} ${100 - percent}`}
                          strokeDashoffset={offset.toString()}
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                          onMouseEnter={(e) => showTooltip(e, `${status.label}: ${status.count} (${percent.toFixed(0)}%)`)}
                          onMouseLeave={hideTooltip}
                        ></circle>
                      );
                    })}
                  </g>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontFamily: 'var(--a-font-display)', fontSize: '1.8rem', color: 'var(--a-text)', lineHeight: 1 }}>
                    {totalDonutCount}
                  </span>
                  <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {statuses.map((status) => (
                  <div key={status.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color }}></span>
                    <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.62rem', color: 'var(--a-text2)', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>{status.label}</span>
                    <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.62rem', color: 'var(--a-text)', fontWeight: 600 }}>{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* HEATMAP & ACTIVITY FEED GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '28px' }}>
          {/* HEATMAP */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Order Frequency Heatmap</div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px' }}>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
                {heatmapData.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {week.map((dayData, dIdx) => {
                      let level = 0;
                      if (dayData.count > 0 && dayData.count <= 2) level = 1;
                      else if (dayData.count > 2 && dayData.count <= 5) level = 2;
                      else if (dayData.count > 5 && dayData.count <= 9) level = 3;
                      else if (dayData.count > 9) level = 4;

                      const formattedDate = dayData.date.toLocaleDateString('en-US', {
                         month: 'short',
                         day: 'numeric',
                         year: 'numeric'
                      });

                      // Supreme Balenciaga themed heatmap cell coloring
                      const cellColors = [
                        '#161616', // L0 - surface
                        'rgba(255, 26, 26, 0.2)', // L1
                        'rgba(255, 26, 26, 0.4)', // L2
                        'rgba(255, 26, 26, 0.7)', // L3
                        '#FF1A1A'  // L4 - Solid premium red
                      ];

                      return (
                        <div
                          key={dIdx}
                          style={{
                            width: '10px',
                            height: '10px',
                            background: cellColors[level],
                            borderRadius: '1px',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease'
                          }}
                          onMouseEnter={(e) => showTooltip(e, `${dayData.count} orders — ${formattedDate}`)}
                          onMouseLeave={hideTooltip}
                        ></div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REAL-TIME ACTIVITY FEED */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Real-Time Action Log</div>
            </div>
            <div className="admin-card-body" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {activityFeed.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--a-text3)', fontSize: '0.75rem', padding: '20px' }}>
                  No recent actions logged.
                </div>
              ) : (
                activityFeed.map((log) => {
                  const namePart = log.adminName || log.adminEmail || 'Admin';
                  const dateObj = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  const timeFormatted = getRelativeTimeString(dateObj);

                  return (
                    <div key={log.id} className="admin-activity-item">
                      <div className="admin-activity-dot"></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-activity-text">
                          <strong>{namePart}</strong> {log.action} <span style={{ color: 'var(--a-red)', fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem' }}>{log.targetLabel || ''}</span>
                        </div>
                        <div className="admin-activity-time">{timeFormatted}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="admin-table-card">
          <div className="admin-card-header">
            <div className="admin-card-title" style={{ margin: 0 }}>Recent Orders</div>
            <Link to="/admin/orders" className="admin-btn">
              View All Orders
            </Link>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--a-text3)', padding: '24px' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o, idx) => {
                    const orderIdDisplay = o.orderId || o.id.slice(0, 8);
                    const dateFormatted = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A';
                    const statusVal = o.status || 'Pending';

                    return (
                      <tr
                        key={o.id}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                        onClick={() => navigate('/admin/orders', { state: { highlightOrderId: o.id } })}
                      >
                        <td className="admin-order-id">#{orderIdDisplay}</td>
                        <td style={{ fontWeight: 600 }}>{o.customerName || 'Anonymous'}</td>
                        <td>{o.productName || 'T-Shirt'}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{o.color || 'white'}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600 }}>
                          ₹{o.price || 499}
                        </td>
                        <td style={{ fontFamily: 'var(--a-font-mono)', color: 'var(--a-text2)' }}>{dateFormatted}</td>
                        <td>
                          <span className={`admin-status ${statusVal.toLowerCase()}`}>{statusVal}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            pointerEvents: 'none',
            zIndex: 9999,
            background: 'var(--a-surface2)',
            border: '1px solid var(--a-border)',
            color: 'var(--a-text)',
            padding: '6px 12px',
            fontFamily: 'var(--a-font-mono)',
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </AdminLayout>
  );
}
