# Isidor

> **Note:** This project is **no longer actively maintained**. The code is provided as-is for archival and informational purposes. I built this for myself personally but Oura has added the new AI-driven _Advisor_ feature which is effectively adjacent to this project.

**Isidor: Your AI-Driven Life Protocol System**

Isidor was envisioned as an intelligent system designed to help users optimize their fitness, nutrition, sleep, cognitive performance, and overall well-being. It aimed to bridge the gap between collecting health data and taking meaningful action by leveraging Artificial Intelligence (AI), seamless wearable data integration, and proven behavioral science principles.

Unlike many health apps that dictate actions, Isidor's philosophy was centered on providing research-backed, objective insights derived from the user's own data (e.g., "*Optimal bedtime appears to be between 9:45 PM and 10:15 PM based on your circadian rhythm data*") without being prescriptive or micromanaging.

## Core Philosophy & Differentiators

Isidor was designed around several key principles that set it apart:

1.  **User Autonomy & Control:** Provide insights, not commands. Users were intended to have full control over their data, the level of AI interaction (from minimal nudges to active coaching), and their health journey.
2.  **Data-Driven Intelligence:** Transform raw health data from various sources (wearables like Oura/Whoop, Apple Health via Thryve, manual inputs) into actionable, personalized, and objective insights using AI.
3.  **Protocol-Based Progress:** Structure health improvements using evidence-based frameworks ("protocols") focused on areas like sleep, activity, and recovery. These protocols allow for measurement, personalization, and continuous adaptation based on real results.
4.  **Privacy-First Design:** User health data privacy and security were paramount. Features included end-to-end encryption, potential for local-first processing, and an opt-out approach to any potential anonymized data sharing for research.
5.  **Research-Backed Recommendations:** AI insights were designed to be objective and based on scientific evidence and the user's specific data, avoiding generic or potentially manipulative nudges.

## The Problem Isidor Aimed to Solve

Existing health and wellness solutions often fall short:

*   **Static, One-Size-Fits-All Plans:** Many apps offer rigid plans that don't adapt to individual needs, progress, or changing circumstances, leading to high abandonment rates.
*   **Underutilized Wearable Data:** While many people track health data with wearables, they often struggle to translate this raw data into meaningful behavioral changes or optimized strategies.
*   **Reactive Health Management:** Decisions are frequently made in response to problems or negative symptoms, rather than proactively optimizing for peak performance and long-term well-being.

## The Isidor Solution: AI-Driven, Adaptive, User-Controlled Protocols

Isidor intended to bridge the data-action gap by:

*   **Real-time Biometric Analysis:** Dynamically refining insights based on continuous data streams.
*   **Objective, Research-Based Observations:** Delivering clear, data-backed observations instead of prescriptive commands.
*   **User-Controlled AI Interaction:** Allowing users to choose how much guidance or analysis they receive from the AI.
*   **Holistic Data Synthesis:** Integrating data from multiple sources (wearables, nutrition logs, HRV, sleep tracking) for a comprehensive understanding of the user's health state.

## Key Features (Envisioned)

*   **Core Metric Tracking:** Sleep patterns & quality, daily activity/steps, heart rate, Heart Rate Variability (HRV).
*   **Foundational Protocols:** Initial focus on Sleep Optimization, Activity Building, and Recovery Management.
*   **AI Integration:** Pattern recognition in health data, analysis of protocol effectiveness, delivery of personalized insights.
*   **Seamless User Experience:** Intuitive data collection (automated sync + manual entry), clear data visualizations, easy protocol management.
*   **Expanded Integrations:** Planned support for a wide range of wearables via the Thryve API.
*   **Advanced AI Capabilities:** Roadmap included predictive health modeling, cross-metric pattern analysis, and proactive optimization suggestions.
*   **Customization & Community:** Future plans involved user-generated protocols and community knowledge sharing.

## Technology Stack (Proposed)

*   **Frontend:** React (Web), React Native (Mobile - Expo)
*   **Backend:** FastAPI (Python)
*   **Database:** PostgreSQL (User Data)
*   **Caching:** Redis (AI Caching)
*   **AI Engine:** PyTorch (Deep Learning), TensorFlow Lite (Potential On-Device Processing)
*   **Wearable Integration:** Thryve API (Targeting Apple Health, Oura, Whoop, etc.)
*   **Cloud Infrastructure:** AWS (e.g., Lambda for scalable backend functions)

## AI Methodologies (Proposed)

The AI engine was planned to utilize various machine learning techniques:

*   **Supervised Learning:** To predict optimal protocol adjustments based on biometric trends and user feedback.
*   **Reinforcement Learning (e.g., Q-Learning):** To optimize long-term health outcomes by learning the best sequences of recommendations or protocol adjustments.
*   **Federated Learning:** Considered for future development to enable model training across user devices without centralizing raw, sensitive health data, enhancing privacy (potentially aligning with HIPAA compliance needs).

## User Privacy & Data Control (Design Principles)

*   **Opt-Out Data Sharing:** Users would need to actively consent to share any anonymized data, even for research purposes.
*   **Controlled AI Engagement:** Users would determine the level of AI interaction they prefer.
*   **Security Focus:** End-to-end encryption and adherence to best practices (aiming for GDPR/HIPAA alignment) were core tenets.
*   **Autonomy:** Emphasis on providing data-backed insights, not manipulative nudges.

## Project Structure

```
isidor/
├── backend/        # FastAPI Python backend application source
├── mobile/         # React Native mobile application source
├── web/            # Landing page for the pojrect
└── README.md       # This file
```

## Getting Started (Development Setup)

**Prerequisites:**

*   Node.js and npm/yarn (for Frontend/Mobile)
*   Python and pip (for Backend)
*   Potentially Docker (if containerized setup is used)
*   Git

**Setup Steps:**

*(These are general steps; specific setup might vary. Check subdirectories for specific READMEs or setup instructions.)*

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd isidor
    ```
2.  **Install Frontend/Mobile Dependencies:**
    ```bash
    npm install  # Or yarn install
    # Potentially navigate into mobile/ or frontend/ first
    # cd mobile && npm install
    ```
3.  **Install Backend Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt # Assuming a requirements.txt file exists
    cd ..
    ```
4.  **Environment Variables:**
    *   Check for any `.env.example` files in `backend/`, `frontend/`, or `mobile/` and create corresponding `.env` files with necessary configurations (API keys, database URLs, etc.).
5.  **Run the Applications:**
    *   **Mobile (Expo):**
        ```bash
        # Ensure you are in the root or mobile directory with package.json
        npm run ios
        # or
        npm run android
        # or
        npm start # To open Expo Dev Tools
        ```
    *   **Backend (FastAPI):**
        ```bash
        cd backend
        uvicorn main:app --reload # Replace main:app with actual entry point if different
        ```
    *   **Web Frontend (React):**
        ```bash
        cd frontend # or web/
        npm start # or yarn start
        ```

## Future Vision (Original Plan)

Beyond the initial MVP, the long-term vision for Isidor included:

*   **Enhanced Protocol Library:** User-generated protocols, specialized health focuses (e.g., chronic disease prevention, cognitive optimization), integration with health professionals.
*   **Advanced AI Capabilities:** Predictive health modeling, cross-metric pattern analysis, proactive health optimization.
*   **Expanded Data Integration:** Support for more wearables, environmental factors, detailed nutrition/supplementation tracking.
*   **Community and Research:** Anonymized data insights for research, community knowledge sharing, protocol effectiveness studies.
*   **API Marketplace:** Allowing third-party developers to build and integrate custom protocols or services.

## Contributing

As this project is no longer maintained, contributions are not being accepted but feel free to reach out if you want to discuss anything [https://josh.dev](https://josh.dev).
