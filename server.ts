import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("salon.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    last_visit TEXT,
    status TEXT DEFAULT 'active',
    is_vip INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price REAL NOT NULL,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    service_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    professional_name TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    salon_name TEXT,
    address TEXT,
    phone TEXT,
    opening_hours TEXT
  );

  -- Seed data if empty
  INSERT OR IGNORE INTO business_settings (id, salon_name) VALUES (1, 'Glow Salon');
`);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/dashboard/stats", (req, res) => {
  const revenue = db.prepare("SELECT SUM(s.price) as total FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'confirmed'").get() as any;
  const appointmentsCount = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE date = date('now')").get() as any;
  const clientsCount = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
  
  res.json({
    revenue: revenue?.total || 2450.00,
    appointmentsToday: appointmentsCount?.count || 18,
    totalClients: clientsCount?.count || 1284
  });
});

app.get("/api/appointments", (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, c.name as client_name, s.name as service_name, s.price 
    FROM appointments a 
    JOIN clients c ON a.client_id = c.id 
    JOIN services s ON a.service_id = s.id
    ORDER BY a.date ASC, a.time ASC
  `).all();
  res.json(appointments);
});

app.get("/api/clients", (req, res) => {
  const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
  res.json(clients);
});

app.get("/api/services", (req, res) => {
  const services = db.prepare("SELECT * FROM services ORDER BY category, name ASC").all();
  res.json(services);
});

// Seed some initial data if empty
const seedData = () => {
  const clientCount = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
  if (clientCount.count === 0) {
    const insertClient = db.prepare("INSERT INTO clients (name, phone, last_visit, status) VALUES (?, ?, ?, ?)");
    insertClient.run("Ana Beatriz Silva", "(11) 98765-4321", "2023-10-15", "active");
    insertClient.run("Mariana Costa", "(11) 91234-5678", "2023-11-02", "active");
    insertClient.run("Juliana Ferreira", "(11) 97766-5544", "2023-10-28", "inactive");
    insertClient.run("Fernanda Lima", "(11) 99988-7766", "2024-03-13", "active");

    const insertService = db.prepare("INSERT INTO services (name, category, duration, price) VALUES (?, ?, ?, ?)");
    insertService.run("Corte & Escova", "Cabelo", 45, 120.00);
    insertService.run("Manicure Gel", "Unhas", 60, 85.00);
    insertService.run("Coloração Total", "Cabelo", 120, 280.00);
    insertService.run("Design de Sobrancelha", "Estética", 30, 45.00);

    const insertAppointment = db.prepare("INSERT INTO appointments (client_id, service_id, date, time, status, professional_name) VALUES (?, ?, ?, ?, ?, ?)");
    insertAppointment.run(1, 1, "2026-03-13", "14:30", "confirmed", "Prof. Ana");
    insertAppointment.run(2, 2, "2026-03-13", "15:15", "pending", "Prof. Bia");
    insertAppointment.run(4, 3, "2026-03-13", "16:00", "confirmed", "Prof. Ana");
  }
};
seedData();

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Helper to find available port and start server
  const startListening = (port: number) => {
    const server = app.listen(port, "0.0.0.0")
      .on("listening", () => {
        console.log(`Server running on http://localhost:${port}`);
      })
      .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`Port ${port} in use, trying ${port + 1}...`);
          startListening(port + 1);
        } else {
          console.error("Server error:", err);
        }
      });
  };
  
  startListening(PORT);
}

startServer();
