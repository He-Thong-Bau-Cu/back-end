pipeline {
    agent any

    tools {
        nodejs "node18"   // Tên bạn đã config ở Global Tool Configuration
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'anlp', url: 'https://github.com/He-Thong-Bau-Cu/back-end.git'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                pm2 stop nestjs-app || true
                pm2 start dist/main.js --name nestjs-app
                pm2 save
                '''
            }
        }
    }
}
