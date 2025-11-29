import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notification',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userIdSocketMap = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId as string;
    if (userId) {
      this.userIdSocketMap.set(userId, client.id);
      client.join(userId);
    }
    console.log('Client connected:', client.id, 'userId:', userId);
    console.log('Client rooms:', client.rooms);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userIdSocketMap.entries()) {
      if (socketId === client.id) {
        this.userIdSocketMap.delete(userId);
        break;
      }
    }
    console.log('Client disconnected:', client.id);
  }

  broadcastNotification(data: any) {
    this.server.emit('notification', data);
  }

  sendToUser(userId: string, data: any) {
    this.server.to(userId).emit('notification', data);
    console.log('Emitting to user:', userId, 'data:', data);
  }

  dataToElectionId(electionId: string, data: any) {
    // Join room theo electionId để nhận cập nhật
    this.server.to(electionId).emit('transferData', data);
    // Cũng emit broadcast để đảm bảo tất cả client đều nhận được
    this.server.emit('transferData', data);
  }

  sendToVoter(voterId: string, data: any) {
    this.server.to(voterId).emit('ballotsVoter', data);
    console.log('Emitting to voter: ', voterId, "data: ", data);
  }

  transferStateDataRT(electionId: string, data: any) {
    // Emit socket với tên transferStateDataRT đến room electionId
    this.server.to(electionId).emit('transferStateDataRT', data);
    // Cũng emit broadcast để đảm bảo tất cả client đều nhận được
    this.server.emit('transferStateDataRT', data);
    console.log('Emitting transferStateDataRT to election:', electionId, 'data:', data);
  }

  // Helper method để client join room theo electionId
  joinElectionRoom(client: Socket, electionId: string) {
    client.join(electionId);
    console.log('Client joined election room:', electionId);
  }
}
