pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                dir('/home/adminuser/back-end') {
                    git branch: 'anlp', url: 'https://github.com/He-Thong-Bau-Cu/back-end.git'
                }
            }
        }

        stage('Install dependencies') {
            steps {
                dir('/home/adminuser/back-end') {
                    sh 'node -v'
                    sh 'npm -v'
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                dir('/home/adminuser/back-end') {
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('/home/adminuser/back-end') {
                    sh '''
                    pm2 stop nestjs-app || true
                    pm2 start dist/main.js --name nestjs-app
                    pm2 save
                    '''
                }
            }
        }
    }
}
