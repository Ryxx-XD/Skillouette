/**
 * Skillouette Career Pathways Engine (Core Feature G)
 * Recommends realistic adjacent roles and alternative career trajectories
 * based on documented transferable competencies and existing qualifications.
 */

import { Entry, CareerPathway, Profile } from '../types.js';

interface PathwayArchetype {
  role: string;
  requiredKeywords: string[];
  transferableKeywords: string[];
  qualifications: string[];
  roadmap: string[];
  disclaimer: string;
}

const ARCHETYPES: PathwayArchetype[] = [
  {
    role: 'Autonomous Systems Firmware Engineer',
    requiredKeywords: ['stm32', 'c++', 'freertos', 'arm', 'can bus', 'lora'],
    transferableKeywords: ['microcontroller', 'embedded', 'firmware', 'c', 'hardware', 'sensors', 'pcb'],
    qualifications: ['B.S. in Electrical Engineering, Computer Engineering, Robotics, or equivalent experience'],
    roadmap: [
      'Deepen mastery of RTOS task scheduling, priority inversion, and memory isolation.',
      'Implement real-time industrial CAN bus or automotive Ethernet telemetry drivers.',
      'Publish open-source benchmark demonstrating deterministic sub-millisecond control loops.'
    ],
    disclaimer: 'Firmware roles in safety-critical robotics may require ISO 26262 or DO-178C compliance knowledge.'
  },
  {
    role: 'Robotics Perception & Sensor Fusion Engineer',
    requiredKeywords: ['ros', 'ros2', 'kalman', 'opencv', 'slam', 'lidar', 'imu', 'point cloud'],
    transferableKeywords: ['c++', 'python', 'state estimation', 'telemetry', 'gps', 'filters', 'math'],
    qualifications: ['Demonstrated linear algebra proficiency, ROS 2 navigation stack, and sensor modeling'],
    roadmap: [
      'Implement an Extended Kalman Filter (EKF) combining IMU accelerometer/gyro with GPS/odometry.',
      'Integrate ROS 2 robot_localization node in simulation (Gazebo) and physical testbed.',
      'Characterize noise covariance matrices under dynamic motion constraints.'
    ],
    disclaimer: 'Advanced perception roles often expect familiarity with PyTorch/TensorFlow for computer vision.'
  },
  {
    role: 'Embedded Hardware & PCB Design Engineer',
    requiredKeywords: ['kicad', 'altium', 'pcb', 'schematic', 'soldering', 'power supply', 'smt'],
    transferableKeywords: ['hardware', 'stm32', 'circuit', 'electronics', 'spi', 'i2c', 'uart', 'oscilloscope'],
    qualifications: ['Hands-on laboratory testing with DMM, oscilloscopes, and logic analyzers'],
    roadmap: [
      'Design a 4-layer mixed-signal board isolating analog sensor traces from digital switching noise.',
      'Perform thermal analysis and design buck-converter power distribution networks.',
      'Assemble prototype PCB with 0603/0402 SMD components and debug signal integrity.'
    ],
    disclaimer: 'Commercial hardware products require FCC/CE EMI certification knowledge.'
  },
  {
    role: 'IoT & Telemetry Systems Architect',
    requiredKeywords: ['lora', 'lorawan', 'mqtt', 'iot', 'cellular', 'gateway', 'telemetry', 'cloud'],
    transferableKeywords: ['rf', 'wireless', 'python', 'networking', 'low power', 'battery', 'sensors'],
    qualifications: ['Understanding of low-power WAN, secure device identity, and edge-to-cloud data ingestion'],
    roadmap: [
      'Deploy an end-to-end LoRaWAN node transmitting sensor telemetry to The Things Network and cloud database.',
      'Optimize sleep modes for sub-10uA standby power consumption.',
      'Implement end-to-end encryption and cryptographic authentication on packet payloads.'
    ],
    disclaimer: 'Cloud architecture aspects require familiarity with RESTful APIs, WebSockets, or AWS IoT Core.'
  },
  {
    role: 'Robotics Test & Field Operations Engineer',
    requiredKeywords: ['testing', 'validation', 'field', 'debugging', 'linux', 'python', 'bash'],
    transferableKeywords: ['hands-on', 'hardware', 'firmware', 'troubleshooting', 'sensors', 'prototyping'],
    qualifications: ['Practical hands-on field testing skills, safety protocol enforcement, and telemetry diagnosis'],
    roadmap: [
      'Develop automated regression test suites for robotic sensor interfaces using Python.',
      'Establish standard operating procedures for field hardware diagnostics and battery management.',
      'Log and analyze field trial failure modes using automated log parsers.'
    ],
    disclaimer: 'Field deployment roles typically involve on-site testing environments and irregular field schedules.'
  }
];

export function generateCareerPathways(
  profile: Profile,
  entries: Entry[]
): CareerPathway[] {
  // Aggregate all profile keywords
  const corpus = `${profile.title} ${profile.summary} ${entries.map(e => `${e.title} ${e.description} ${e.tags.join(' ')}`).join(' ')}`.toLowerCase();

  const pathways: CareerPathway[] = [];

  for (const archetype of ARCHETYPES) {
    const matchedRequired = archetype.requiredKeywords.filter(k => corpus.includes(k));
    const matchedTransferable = archetype.transferableKeywords.filter(k => corpus.includes(k));

    const totalTargetSkills = archetype.requiredKeywords.length;
    const directScore = (matchedRequired.length / Math.max(totalTargetSkills, 1)) * 60;
    const transferableScore = (matchedTransferable.length / Math.max(archetype.transferableKeywords.length, 1)) * 40;
    const similarityScore = Math.min(Math.round(directScore + transferableScore), 95);

    const remainingGaps = archetype.requiredKeywords.filter(k => !matchedRequired.includes(k));

    pathways.push({
      id: `pathway_${archetype.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      target_role: archetype.role,
      similarity_score: Math.max(similarityScore, 35),
      transferable_competencies: [
        ...matchedRequired.map(k => `Direct technical proficiency: ${k.toUpperCase()}`),
        ...matchedTransferable.slice(0, 3).map(k => `Transferable foundational competency: ${k}`)
      ],
      remaining_skill_gaps: remainingGaps.map(g => `Specialized domain skill: ${g}`),
      required_qualifications: archetype.qualifications,
      recommended_roadmap: archetype.roadmap,
      limitations_disclaimer: archetype.disclaimer + ' Market availability varies by geographical tech hub.'
    });
  }

  // Sort by highest similarity score
  return pathways.sort((a, b) => b.similarity_score - a.similarity_score);
}
