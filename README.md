# Firebase JSON Web App

This project is a web application that allows users to save JSON data to Firestore in Firebase. It provides a simple interface for inputting JSON data and storing it in a Firestore database.

## Project Structure

```
firebase-json-webapp
├── public
│   └── index.html
├── src
│   ├── components
│   │   └── SaveJsonForm.js
│   ├── firebase.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd firebase-json-webapp
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Firebase Configuration

Before running the application, you need to set up Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or use an existing one.
3. Add a web app to your Firebase project and copy the Firebase configuration.
4. Update the `src/firebase.js` file with your Firebase configuration.

### Running the Application

To start the application, run:

```
npm start
```

This will start the development server and open the application in your default web browser.

### Usage

- Use the form provided in the application to input your JSON data.
- Upon submission, the data will be saved to Firestore.

### License

This project is licensed under the MIT License.