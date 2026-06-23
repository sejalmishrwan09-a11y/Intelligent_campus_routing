const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 8081;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Teju@2005',
  database: 'campus_routing'
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected!");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////////////////////
//LOGIN ROUTE
//////////////////////////////////////////////////////
app.post('/login', (req, res) => {
  const { user_id, password, role } = req.body;
  const query = `SELECT * FROM users WHERE user_id = ? AND password = ? AND role = ?`;

  db.query(query, [user_id, password, role], (err, result) => {
    if (err) return res.status(500).send("Internal server error");

    if (result.length > 0) {
      const user = result[0];
      if (user.role === 'admin') {
        res.redirect(`/admin.html?user_name=${user.name}&user_id=${user.user_id}`);
      } else {
        res.redirect(`/dashboard.html?user_name=${user.name}&user_id=${user.user_id}`);
      }
    } else {
      res.send("<h3>Login failed. Please check your credentials.</h3>");
    }
  });
});

//////////////////////////////////////////////////////
//USER & ADMIN API ROUTES
//////////////////////////////////////////////////////
app.get('/api/user/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM users WHERE user_id = ?', [id], (err, result) => {
    if (err) return res.status(500).send("Error fetching user");
    res.json(result[0]);
  });
});

app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) return res.status(500).send('Error fetching users');
    res.json(result);
  });
});

app.get('/api/transfers', (req, res) => {
  db.query('SELECT * FROM transfer_history ORDER BY transfer_date DESC', (err, result) => {
    if (err) return res.status(500).send('Error fetching transfers');
    res.json(result);
  });
});

app.get('/transfer-history/:user_name', (req, res) => {
  const userName = req.params.user_name;
  db.query('SELECT * FROM transfer_history WHERE user_name = ? ORDER BY transfer_date DESC', [userName], (err, results) => {
    if (err) return res.status(500).send('Error fetching history');
    res.json(results);
  });
});

//////////////////////////////////////////////////////
//GRAPH DATA FOR VISUALIZATION
//////////////////////////////////////////////////////
app.get('/graph-data', (req, res) => {
  const getUsers = `SELECT user_id AS id, name AS label, role FROM users`;
  const getServers = `SELECT server_id + 10000 AS id, server_name AS label, 'server' AS role FROM servers`;
  const getEdges = `SELECT source_name, destination_name, weight, time FROM graph`;

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(getUsers, (err, results) => (err ? reject(err) : resolve(results)));
    }),
    new Promise((resolve, reject) => {
      db.query(getServers, (err, results) => (err ? reject(err) : resolve(results)));
    }),
    new Promise((resolve, reject) => {
      db.query(getEdges, (err, results) => (err ? reject(err) : resolve(results)));
    }),
  ])
    .then(([users, servers, edges]) => {
      const nodes = [
        ...users.map(u => ({ id: u.id, label: u.label, group: u.role })),
        ...servers.map(s => ({ id: s.id, label: s.label, group: 'server' })),
      ];

      const nameToId = {};
      nodes.forEach(node => {
        nameToId[node.label] = node.id;
      });

      const edgesVis = edges
        .map(edge => {
          const from = nameToId[edge.source_name];
          const to = nameToId[edge.destination_name];
          if (!from || !to) return null;
          return {
            from,
            to,
            label: `w:${edge.weight}, t:${edge.time}`,
            font: { align: 'middle' },
            arrows: 'to',
          };
        })
        .filter(e => e !== null);

      res.json({ nodes, edges: edgesVis });
    })
    .catch(err => {
      console.error('Error fetching graph data:', err);
      res.status(500).send('Error fetching graph data');
    });
});

//////////////////////////////////////////////////////
//DIJKSTRA ALGORITHM
//////////////////////////////////////////////////////
function dijkstra(graph, start, servers) {
  const distances = {};
  const previous = {};
  const nodes = new Set(Object.keys(graph));

  nodes.forEach(node => distances[node] = Infinity);
  distances[start] = 0;

  while (nodes.size > 0) {
    let minNode = null;
    nodes.forEach(node => {
      if (minNode === null || distances[node] < distances[minNode]) {
        minNode = node;
      }
    });

    if (distances[minNode] === Infinity) break;
    nodes.delete(minNode);

    if (servers.includes(minNode)) {
      const path = [];
      let current = minNode;
      while (current) {
        path.unshift(current);
        current = previous[current];
      }
      return { distance: distances[minNode], path };
    }

    const neighbors = graph[minNode] || [];
    neighbors.forEach(({ to, weight }) => {
      const alt = distances[minNode] + weight;
      if (alt < (distances[to] || Infinity)) {
        distances[to] = alt;
        previous[to] = minNode;
        nodes.add(to);
      }
    });
  }

  return null;
}

//////////////////////////////////////////////////////
//SHORTEST PATH ROUTE
//////////////////////////////////////////////////////
app.post('/shortest-path', (req, res) => {
  const { user_name, data_size } = req.body;
  const thresholdMB = 1024;
  const column = data_size > thresholdMB ? 'time' : 'weight';

  Promise.all([
    new Promise((resolve, reject) => {
      db.query('SELECT * FROM graph', (err, edges) => (err ? reject(err) : resolve(edges)));
    }),
    new Promise((resolve, reject) => {
      db.query('SELECT server_name FROM servers', (err, servers) => (err ? reject(err) : resolve(servers.map(s => s.server_name))));
    }),
  ]).then(([edges, servers]) => {
    const graph = {};
    edges.forEach(edge => {
      if (!graph[edge.source_name]) graph[edge.source_name] = [];
      graph[edge.source_name].push({
        to: edge.destination_name,
        weight: data_size > thresholdMB ? edge.time : edge.weight,
      });
    });

    const pathResult = dijkstra(graph, user_name, servers);

    if (!pathResult) {
      return res.send(`<h3 style="color: red; text-align: center;">❌ No path found for this user.</h3>`);
    }

    const { path, distance } = pathResult;
    const from = path[0];
    const to = path[path.length - 1];

    db.query(
      'INSERT INTO transfer_history (user_name, data_size, server_reached, total_metric_used, metric_type) VALUES (?, ?, ?, ?, ?)',
      [user_name, data_size, to, distance, column],
      (err) => {
        if (err) console.error('Error logging transfer:', err);
      }
    );

    res.send(`
      <div style="
        background: #ffffff;
        color: #333;
        border-radius: 10px;
        padding: 25px;
        margin-top: 30px;
        box-shadow: 0 0 15px rgba(0,0,0,0.1);
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
        text-align: center;
        font-family: 'Segoe UI', sans-serif;
      ">
        <h2 style="color: #2a9d8f;">📡 Shortest Path Calculated</h2>
        <p><strong>Routing based on:</strong> ${column.toUpperCase()} (${data_size > thresholdMB ? 'Data > 1 GB' : 'Data ≤ 1 GB'})</p>
        <p><strong>From:</strong> ${from}</p>
        <p><strong>To:</strong> ${to}</p>
        <p><strong>Total ${column === 'time' ? 'Time (ms)' : 'Weight'}:</strong> ${distance}</p>
        <p><strong>Your Data Size:</strong> ${data_size} MB</p>
        <p><strong>Path:</strong></p>
        <ul style="text-align: left; display: inline-block; margin-top: 10px;">
          ${path.map(node => `<li>${node}</li>`).join('')}
        </ul>
      </div>
    `);
  }).catch(err => {
    console.error(err);
    res.status(500).send('Server error');
  });
});

//////////////////////////////////////////////////////
//START SERVER
//////////////////////////////////////////////////////
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
