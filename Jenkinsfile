pipeline {
  agent any

  environment {
    MONGO_URL = credentials('MONGO_URL')
    DATABASE_URL = credentials('DATABASE_URL')
    JWT_SECRET = credentials('JWT_SECRET')
    JWT_REFRESH_SECRET = credentials('JWT_REFRESH_SECRET')
    ESRI_KEY = credentials('ESRI_KEY')
    PORT = '5001'
    NODE_ENV = 'production'
    RAILWAY_TOKEN = credentials('RAILWAY_TOKEN')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          try {
            sh 'npm ci'
          } catch (err) {
            echo "npm ci failed, running npm install"
            sh 'npm install'
          }
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Run Prisma Migrations') {
      steps {
        sh 'npx prisma migrate deploy'
      }
    }

    stage('Start Server') {
      steps {
        sh 'npm start &'
      }
    }

    stage('Deploy to Railway') {
      steps {
            sh '''
            npm install @railway/cli@latest
            echo $RAILWAY_TOKEN | npx railway login --browserless
            npx railway up --service doctors-backend --ci
       '''
      }
    }
  }

  post {
    always {
      echo 'Pipeline completed'
    }
  }
}
