pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'anlp', url: 'https://github.com/He-Thong-Bau-Cu/back-end.git'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'node -v'
                sh 'npm -v'
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
                  rm -rf /home/adminuser/back-end/dist
                  sudo -u adminuser bash -c '
                    cp -r dist /home/adminuser/back-end/ &&
                    cp -f .env /home/adminuser/back-end/.env &&
                    cd /home/adminuser/back-end &&
                    pm2 restart nest-app || pm2 start dist/main.js --name nest-app -f &&
                    pm2 save
                  '
                '''
            }
        }
    }
}
