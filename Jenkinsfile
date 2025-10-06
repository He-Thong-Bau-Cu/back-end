pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'anlp', url: 'https://github.com/He-Thong-Bau-Cu/back-end.git'
            }
        }

        stage('Build as adminuser') {
            steps {
                sh '''
                  sudo -u adminuser bash -c '
                    cd /home/adminuser/back-end &&
                    git fetch origin anlp &&
                    git reset --hard origin/anlp &&
                    npm install &&
                    npm run build
                  '
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                  sudo -u adminuser bash -c '
                    cd /home/adminuser/back-end &&
                    pm2 restart nest-app || pm2 start dist/main.js --name nest-app -f &&
                    pm2 save
                  '
                '''
            }
        }
    }
}
