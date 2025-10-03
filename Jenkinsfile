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
              sudo -u adminuser bash -c "
                  rm -rf /home/adminuser/back-end/dist &&
                  cp -r dist /home/adminuser/back-end/ &&
                  cd /home/adminuser/back-end &&
                  pm2 stop nest-app || true &&
                  pm2 start dist/main.js --name nest-app &&
                  pm2 save
              "
              '''
          }
         }

    }
}
