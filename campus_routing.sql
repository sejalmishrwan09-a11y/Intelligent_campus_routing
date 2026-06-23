-- Create Database
CREATE DATABASE IF NOT EXISTS campus_routing;
USE campus_routing;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    name VARCHAR(100),
    role ENUM('teacher', 'student'),
    password VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    phone_no VARCHAR(15)
);

-- Servers Table
CREATE TABLE servers (
    server_id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(100)
);

-- Graph Table
CREATE TABLE graph (
    source_name VARCHAR(100),
    destination_name VARCHAR(100),
    weight INT,
    time INT Create Database
CREATE DATABASE IF NOT EXISTS campus_routing;
USE campus_routing;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    name VARCHAR(100),
    role ENUM('teacher', 'student'),
    password VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    phone_no VARCHAR(15)
);

-- Servers Table
CREATE TABLE servers (
    server_id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(100)
);

-- Graph Table
CREATE TABLE graph (
    source_name VARCHAR(100),
    destination_name VARCHAR(100),
    weight INT,
    time INT
);
CREATE TABLE transfer_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255),
  data_size INT,
  server_reached VARCHAR(255),
  total_metric_used FLOAT,
  metric_type VARCHAR(10), -- 'time' or 'weight'
  transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
USE campus_routing;
INSERT INTO users (user_id, name, role, password, email, phone_no) VALUES
(1, 'Aastha Sharma', 'student', 'aastha01', 'aastha@student.edu', '7895231293'),
(2, 'Tejaswi Bailwal', 'student', 'tejaswi02', 'tejaswi@student.edu', '4512036987'),
(3, 'Swati Joshi', 'student', 'swati03', 'swati@student.edu', '7469312469'),
(4, 'Sejal Mishrwan', 'student', 'sejal04', 'sejal@student.edu', '1597420496'),
(5, 'Varnika Sharma', 'student', 'varnika05', 'varnika@student.edu', '7893243075'),
(6, 'Vansh Uniyal', 'student', 'vansh06', 'vansh@student.edu', '9630412306'),
(7, 'Sachin Rawat', 'teacher', 'sachin07', 'sachin@faculty.edu', '1697410242'),
(8, 'Shivam Uniyal', 'teacher', 'shivam08', 'shivam@faculty.edu', '5630142697'),
(9, 'Ayush Payal', 'teacher', 'ayush09', 'ayush@faculty.edu', '6320798413'),
(10, 'Ojaswi Bailwal', 'teacher', 'ojaswi10', 'ojaswi@faculty.edu', '9601763752');
(11, 'Admin User', 'admin', 'admin123', 'admin@example.com', '9999999999');
INSERT INTO servers (server_name) VALUES
('Server A'),
('Server B'),
('Server C');
INSERT INTO graph (source_name, destination_name, weight, time) VALUES
('Aastha Sharma', 'Server A', 100, 8),
('Aastha Sharma', 'Server B', 200, 5),
('Tejaswi Bailwal', 'Server A', 500, 2),
('Tejaswi Bailwal', 'Shivam Uniyal', 150, 6),
('Tejaswi Bailwal', 'Ayush Payal', 100, 5),
('Swati Joshi', 'Sejal Mishrwan', 296, 7),
('Swati Joshi', 'Ojaswi Bailwal', 700, 8),
('Swati Joshi', 'Server C', 500, 6),
('Sejal Mishrwan', 'Sachin Rawat', 796, 5),
('Vansh Uniyal', 'Swati Joshi', 200, 3),
('Vansh Uniyal', 'Ojaswi Bailwal', 500, 8),
('Varnika Sharma', 'Server C', 850, 6),
('Varnika Sharma', 'Server A', 750, 9),
('Sachin Rawat', 'Server B', 695, 4),
('Shivam Uniyal', 'Sachin Rawat', 175, 15),
('Shivam Uniyal', 'Ayush Payal', 350, 11),
('Ayush Payal', 'Vansh Uniyal', 500, 13),
('Ojaswi Bailwal', 'Server C', 700, 12);
);
