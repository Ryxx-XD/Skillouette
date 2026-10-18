import { ResumeData } from './types.js';

export const initialResumeData: ResumeData = {
  profile: {
    name: "EJ Pondales",
    title: "Robotics Engineering Student & Autonomous Systems Developer",
    email: "ej.pondales.robotics@gmail.com",
    phone: "+1 (555) 349-8821",
    location: "Metro Manila, Philippines / Global Remote",
    github: "https://github.com/ejpondales",
    linkedin: "https://linkedin.com/in/ejpondales",
    website: "https://ejpondales.dev",
    summary: "First-year Robotics Engineering student and autonomous systems developer with hands-on experience designing cyber-physical architectures, real-time embedded firmware, and edge computer vision. Active builder across aquaculture surface vessels, clinical wearable telemetry, and intelligent traffic sensing platforms."
  },
  sections: [
    { id: "sec_edu", name: "Education", order: 1, is_custom: false, is_visible: true },
    { id: "sec_skills", name: "Technical Skills", order: 2, is_custom: false, is_visible: true },
    { id: "sec_exp", name: "Applied Experience", order: 3, is_custom: false, is_visible: true },
    { id: "sec_proj", name: "Featured Projects", order: 4, is_custom: false, is_visible: true },
    { id: "sec_awards", name: "Awards & Achievements", order: 5, is_custom: false, is_visible: true },
    { id: "sec_cert", name: "Certifications and Training", order: 6, is_custom: false, is_visible: true },
    { id: "sec_lead", name: "Leadership, Mentorship & Service", order: 7, is_custom: false, is_visible: true },
    { id: "sec_ref", name: "References", order: 8, is_custom: false, is_visible: true }
  ],
  subsections: [
    { id: "sub_lang", section_id: "sec_skills", name: "Programming Languages", order: 1 },
    { id: "sub_ai", section_id: "sec_skills", name: "AI & Machine Learning", order: 2 },
    { id: "sub_robotics", section_id: "sec_skills", name: "Robotics & Controls", order: 3 },
    { id: "sub_embedded", section_id: "sec_skills", name: "Embedded Systems & Firmware", order: 4 },
    { id: "sub_pcb", section_id: "sec_skills", name: "PCB Design & Electronics", order: 5 },
    { id: "sub_tools", section_id: "sec_skills", name: "Software & Engineering Tools", order: 6 }
  ],
  entries: [
    // Education
    {
      id: "ent_edu_1",
      section_id: "sec_edu",
      title: "Bachelor of Science in Robotics Engineering",
      institution: "College of Engineering & Autonomous Systems",
      date_start: "2024",
      date_end: "2028 (Expected)",
      description: "Dean's List Honor Scholar. Key Coursework: Mechatronics System Design, Robot Kinematics & Dynamics, Embedded Microcontrollers (ARM Cortex-M), Linear Control Systems, TinyML.",
      metrics: "GPA: 3.92 / 4.00",
      tags: ["Robotics", "Mechatronics", "Embedded Systems", "Honors"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    // Skills - Programming Languages
    {
      id: "ent_sk_lang",
      section_id: "sec_skills",
      subsection_id: "sub_lang",
      title: "Languages",
      description: "C/C++ (Modern C++17, Bare-Metal Embedded C), Python (NumPy, SciPy, PyTorch), Rust (Embedded no_std), JavaScript/TypeScript, MATLAB/Simulink",
      tags: ["C++", "C", "Python", "Rust", "MATLAB", "TypeScript"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    // Skills - AI & Machine Learning
    {
      id: "ent_sk_ai",
      section_id: "sec_skills",
      subsection_id: "sub_ai",
      title: "Machine Learning & Edge AI",
      description: "PyTorch, TensorFlow Lite Micro, OpenCV, YOLOv8/v11, Extended Kalman Filtering (EKF), Edge Impulse, Sensor Fusion Algorithms",
      tags: ["PyTorch", "OpenCV", "YOLO", "TinyML", "Sensor Fusion", "EKF"],
      links: [],
      order: 2,
      confidence: 1.0,
      is_active: true
    },
    // Skills - Robotics
    {
      id: "ent_sk_robotics",
      section_id: "sec_skills",
      subsection_id: "sub_robotics",
      title: "Robotics Stack",
      description: "ROS 2 (Humble/Jazzy), Nav2 Autonomous Navigation, Gazebo Sim, MoveIt 2, Kinematics & Inverse Kinematics, Guidance Navigation & Control (GNC)",
      tags: ["ROS2", "Gazebo", "Nav2", "MoveIt", "GNC", "SLAM"],
      links: [],
      order: 3,
      confidence: 1.0,
      is_active: true
    },
    // Skills - Embedded Systems
    {
      id: "ent_sk_embedded",
      section_id: "sec_skills",
      subsection_id: "sub_embedded",
      title: "Microcontrollers & Protocols",
      description: "STM32 (HAL/LL & Register-level), ESP32-S3, ARM Cortex-M4/M7, FreeRTOS, LoRaWAN (SX1262), CAN Bus, SPI, I2C, UART, DMA, PWM Timers",
      tags: ["STM32", "ESP32", "FreeRTOS", "LoRaWAN", "CAN Bus", "Hardware Drivers"],
      links: [],
      order: 4,
      confidence: 1.0,
      is_active: true
    },
    // Skills - PCB Design
    {
      id: "ent_sk_pcb",
      section_id: "sec_skills",
      subsection_id: "sub_pcb",
      title: "Hardware Engineering",
      description: "KiCad 8, Altium Designer, 4-Layer High-Speed PCB Layout, Switching Regulators, Analog Signal Conditioning, SMT Soldering (0402 / QFN), Oscilloscopes",
      tags: ["KiCad", "Altium", "PCB Design", "SMD Soldering", "Power Electronics"],
      links: [],
      order: 5,
      confidence: 1.0,
      is_active: true
    },
    // Skills - Tools
    {
      id: "ent_sk_tools",
      section_id: "sec_skills",
      subsection_id: "sub_tools",
      title: "Engineering Tools",
      description: "Linux (Ubuntu Server/Desktop), Git, Docker, SolidWorks CAD, Autodesk Fusion 360, Bambu Studio / FDM 3D Prototyping, CMake",
      tags: ["Linux", "Git", "Docker", "SolidWorks", "3D Printing", "CAD"],
      links: [],
      order: 6,
      confidence: 1.0,
      is_active: true
    },
    // Applied Experience
    {
      id: "ent_exp_1",
      section_id: "sec_exp",
      title: "Robotics Hardware & Firmware Developer",
      role: "Lead Developer",
      institution: "Autonomous Field Telemetry Lab",
      date_start: "May 2024",
      date_end: "Present",
      description: "Engineered and deployed low-latency telemetry pipelines for remote agricultural and environmental sensing nodes. Architected custom firmware in C++ with FreeRTOS handling sensor polling, packet encryption, and power-saving sleep cycles.",
      metrics: "Achieved 99.4% packet delivery over 5km non-line-of-sight LoRa links while extending battery operational lifespan to 45+ days per charge.",
      tags: ["Firmware", "LoRa", "FreeRTOS", "Low Power", "C++"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_exp_2",
      section_id: "sec_exp",
      title: "Embedded Systems Engineering Intern",
      role: "Research & Development Intern",
      institution: "Cyber-Physical Systems Innovation Lab",
      date_start: "Jan 2024",
      date_end: "April 2024",
      description: "Designed dual Extended Kalman Filter (EKF) state estimation node in ROS 2 combining 9-DOF IMU and RTK-GNSS measurements for field robot position tracking under GPS-degraded conditions.",
      metrics: "Reduced positional drift error by 42% compared to standard raw-GPS odometry baselines during dynamic outdoor obstacle traversal.",
      tags: ["ROS 2", "EKF", "Sensor Fusion", "RTK-GNSS", "State Estimation"],
      links: [],
      order: 2,
      confidence: 1.0,
      is_active: true
    },
    // Featured Projects
    {
      id: "ent_proj_1",
      section_id: "sec_proj",
      title: "AIoT-GNC Autonomous Aquaculture Surface Vessel (ASV)",
      role: "Lead Mechatronics & Guidance Engineer",
      institution: "Tilapia Pond Monitoring Project",
      date_start: "2024",
      date_end: "Present",
      description: "Designed an autonomous robotic vessel powered by solar arrays and dual brushless thrusters for continuous dissolved oxygen (DO), pH, oxidation-reduction potential (ORP), and temperature mapping across tilapia farming ponds. Created custom 4-layer STM32 power management PCB with integrated MPPT buck converter and LoRaWAN long-range telemetry transmitter.",
      metrics: "Reduced manual pond inspection labor by 75% and enabled early warning detection of severe nighttime hypoxic events 3 hours prior to fish distress thresholds.",
      tags: ["Aquaculture", "Robotics", "STM32", "LoRaWAN", "PCB Design", "GNC", "FreeRTOS"],
      links: ["https://github.com/ejpondales/tilapia-aiot-asv"],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_proj_2",
      section_id: "sec_proj",
      title: "Wearable Fall-Detection & Seizure Classification TinyML Platform",
      role: "Firmware & Embedded ML Developer",
      institution: "Clinical Biomarker Device Project",
      date_start: "2024",
      date_end: "2025",
      description: "Developed an ultra-low-power biomedical wearable equipped with a 6-DOF IMU (BMI270) and photoplethysmography sensor. Quantized and deployed an optimized 1D Convolutional Neural Network on an ARM Cortex-M4 MCU running FreeRTOS, classifying abnormal tremor dynamics and sudden impact kinematic profiles.",
      metrics: "Attained 96.8% sensitivity on tremor classification with sub-350ms emergency detection latency; power consumption held below 12mW for 72-hour continuous battery life.",
      tags: ["TinyML", "ARM Cortex-M4", "Sensors", "Healthcare Robotics", "Edge AI", "C++"],
      links: ["https://github.com/ejpondales/clinical-wearable-tinyml"],
      order: 2,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_proj_3",
      section_id: "sec_proj",
      title: "Smart-City Edge Vision Traffic Violation & Flow Analytics",
      role: "Computer Vision & Edge Pipeline Lead",
      institution: "Intelligent Urban Mobility Project",
      date_start: "2024",
      date_end: "Present",
      description: "Engineered an edge computer vision monitoring pipeline deployed on NVIDIA Jetson Orin Nano for multi-lane intersection analysis. Implemented TensorRT-accelerated YOLOv8 object detection paired with ByteTrack trajectory estimation for automated red-light and wrong-way violation logging.",
      metrics: "Maintained steady 42 FPS throughput across 3 synchronized 1080p RTSP video feeds within a 15W edge power budget, with 98.1% vehicle count accuracy.",
      tags: ["Computer Vision", "YOLO", "Jetson Orin", "TensorRT", "Python", "Edge AI"],
      links: ["https://github.com/ejpondales/smartcity-edge-vision"],
      order: 3,
      confidence: 1.0,
      is_active: true
    },
    // Awards & Achievements
    {
      id: "ent_aw_1",
      section_id: "sec_awards",
      title: "1st Place Champion - National Autonomous Robotics Hackathon",
      institution: "National Robotics League",
      date_start: "2025",
      description: "Led 4-member team to construct a rapidly deployable search-and-rescue rover featuring real-time 2D SLAM, obstacle avoidance, and thermal camera payload within 36 hours.",
      tags: ["1st Place", "Hackathon", "SLAM", "Leadership"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_aw_2",
      section_id: "sec_awards",
      title: "Best Technical Innovation Award - Agritech IoT Summit",
      institution: "Regional Agricultural Technology Forum",
      date_start: "2024",
      description: "Recognized for the development and field deployment of the AIoT Tilapia Aquaculture Surface Vessel telemetry system.",
      tags: ["Innovation Award", "Agritech", "IoT"],
      links: [],
      order: 2,
      confidence: 1.0,
      is_active: true
    },
    // Certifications & Training
    {
      id: "ent_cert_1",
      section_id: "sec_cert",
      title: "ROS 2 Developer Professional Certification",
      institution: "ConstructSim & Open Robotics Certified Partner",
      date_start: "2024",
      description: "Comprehensive certification covering ROS 2 nodes, lifecycle nodes, DDS middleware QoS profiles, Nav2 navigation stack, and Gazebo simulation integration.",
      tags: ["ROS 2", "Certification", "Robotics"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_cert_2",
      section_id: "sec_cert",
      title: "IPC-A-610 Electronic Assemblies Inspection & Solder Training",
      institution: "Electronics Manufacturing Standards Institute",
      date_start: "2024",
      description: "Trained in surface-mount device soldering down to 0402 package sizing, quality control criteria, and lead-free rework procedures.",
      tags: ["Hardware", "Soldering", "IPC-A-610"],
      links: [],
      order: 2,
      confidence: 1.0,
      is_active: true
    },
    // Leadership, Mentorship & Service
    {
      id: "ent_lead_1",
      section_id: "sec_lead",
      title: "Founding President & Hardware Workshop Lead",
      institution: "University Autonomous Robotics Society",
      date_start: "2024",
      date_end: "Present",
      description: "Spearheaded hands-on workshops in KiCad schematic design, SMD soldering, and ROS 2 robotics fundamentals for over 120 undergraduate students.",
      tags: ["Leadership", "Teaching", "Community", "Workshops"],
      links: [],
      order: 1,
      confidence: 1.0,
      is_active: true
    },
    {
      id: "ent_lead_2",
      section_id: "sec_lead",
      title: "STEM Mentor - High School Mechatronics Bootcamp",
      institution: "Youth Robotics Outreach Program",
      date_start: "2024",
      date_end: "2025",
      description: "Mentored 3 student teams in Arduino microcontrollers, C++ programming basics, and gear train mechanisms for competitive robotics tournaments.",
      tags: ["Mentorship", "STEM", "Youth Education"],
      links: [],
      order: 2,
      confidence: 1.0,
      is_active: true
    }
  ],
  references: [
    {
      id: "ref_1",
      name: "Dr. Aris Thorne",
      title_org: "Director, Mechatronics & Autonomous Field Robotics Laboratory",
      email: "aris.thorne@university.edu",
      phone: "+1 (555) 234-5678",
      relationship: "Academic Advisor & Research Laboratory Principal Investigator"
    },
    {
      id: "ref_2",
      name: "Engr. Maria Santos, PE",
      title_org: "Chief Systems Architect, BioRobotics & Sensing Devices Inc.",
      email: "maria.santos@biorobotics.io",
      phone: "+1 (555) 876-5432",
      relationship: "Industry Internship Mentor & Senior Firmware Evaluator"
    }
  ],
  snapshots: [],
  logs: [],
  settings: {
    llm_provider: 'local',
    model_name: 'gemini-1.5-flash',
    temperature: 0.2
  }
};
