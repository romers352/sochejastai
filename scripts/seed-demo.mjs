import mysql from "mysql2/promise";

async function main() {
  const host = process.env.MYSQL_HOST;
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const useSsl = String(process.env.MYSQL_SSL || "").trim() === "1" || String(process.env.MYSQL_SSL || "").toLowerCase() === "true";
  const ca = process.env.MYSQL_CA || undefined;

  if (!host || !user || !password || !database) {
    console.error("Missing MySQL connection env vars. Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (and optionally MYSQL_PORT, MYSQL_SSL, MYSQL_CA).\nTip: create a .env.local with these values before running `npm run seed:demo`.");
    process.exit(1);
  }

  const ssl = useSsl ? (ca ? { ca } : {}) : undefined;
  const pool = await mysql.createPool({ host, port, user, password, database, ssl, waitForConnections: true, connectionLimit: 5 });

  try {
    // Ensure tables exist
    await pool.execute(
      "CREATE TABLE IF NOT EXISTS testimonials (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, role VARCHAR(255) NOT NULL, quote TEXT NOT NULL, initials VARCHAR(10) NULL, rating INT NOT NULL DEFAULT 5, avatar VARCHAR(255) NULL)"
    );
    await pool.execute(
      "CREATE TABLE IF NOT EXISTS services (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, icon VARCHAR(255) NULL)"
    );

    // Seed only if empty
    const [[tCountRow]] = await pool.query("SELECT COUNT(*) AS cnt FROM testimonials");
    const [[sCountRow]] = await pool.query("SELECT COUNT(*) AS cnt FROM services");
    const tCount = Number((tCountRow || {}).cnt || 0);
    const sCount = Number((sCountRow || {}).cnt || 0);

    const testimonials = [
      { name: "Aayush Shrestha", role: "Project Manager", quote: "Soche Jastai delivered on time with great attention to detail.", initials: "AS", rating: 5, avatar: null },
      { name: "Pratima Karki", role: "Marketing Lead", quote: "The team was responsive and the final result exceeded expectations.", initials: "PK", rating: 5, avatar: null },
      { name: "Rajan Gurung", role: "Founder", quote: "Clear communication, solid execution — highly recommend.", initials: "RG", rating: 5, avatar: null },
      { name: "Sita Sharma", role: "Designer", quote: "They turned our ideas into a polished product.", initials: "SS", rating: 4, avatar: null },
      { name: "Anil Thapa", role: "Engineer", quote: "Reliable and professional throughout the engagement.", initials: "AT", rating: 5, avatar: null },
    ];

    const services = [
      { title: "Branding & Identity", description: "Crafting cohesive visual identities that communicate your brand’s story.", icon: null },
      { title: "Web Design", description: "Designing modern, responsive websites focused on usability and performance.", icon: null },
      { title: "Web Development", description: "Building robust, scalable web apps using modern frameworks and best practices.", icon: null },
      { title: "Graphics & Illustration", description: "Creating custom graphics, illustrations, and visuals for campaigns and products.", icon: null },
      { title: "Video Production", description: "Producing engaging video content for marketing, education, and storytelling.", icon: null },
      { title: "SEO & Optimization", description: "Improving discoverability, speed, and user experience across your site.", icon: null },
    ];

    if (tCount === 0) {
      console.log("Seeding testimonials...");
      for (const t of testimonials) {
        await pool.execute(
          "INSERT INTO testimonials (name, role, quote, initials, rating, avatar) VALUES (?, ?, ?, ?, ?, ?)",
          [t.name, t.role, t.quote, t.initials, t.rating, t.avatar]
        );
      }
      console.log(`Inserted ${testimonials.length} testimonials.`);
    } else {
      console.log(`Testimonials table already has ${tCount} rows. Skipping.`);
    }

    if (sCount === 0) {
      console.log("Seeding services...");
      for (const s of services) {
        await pool.execute(
          "INSERT INTO services (title, description, icon) VALUES (?, ?, ?)",
          [s.title, s.description, s.icon]
        );
      }
      console.log(`Inserted ${services.length} services.`);
    } else {
      console.log(`Services table already has ${sCount} rows. Skipping.`);
    }

    console.log("Seed completed.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();