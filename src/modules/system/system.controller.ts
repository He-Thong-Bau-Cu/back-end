import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put} from '@nestjs/common';
import {SystemService} from './system.service';
import {SearchDTO} from 'src/common/dto/search.dto';
import {BaseResponse} from 'src/common/dto/base-response.dto';
import {MESSAGES} from '@nestjs/core/constants';
import {MESSAGE_STATUS} from 'src/common/enums/status.enum';
import {ENDPOINT, METHOD} from 'src/common/enums/method.enum';
import {RoleService} from "./role/role.service";
import {RoleDto} from "../../common/dto/role.dto";
import {RolePermissionDto} from "../../common/dto/rolePermission.dto";
import {PermissionDto} from "../../common/dto/permission.dto";
import {ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";

@ApiTags('Hệ thống')
@Controller('system')
export class SystemController {
    constructor(
        private readonly systemService: SystemService,
        private readonly roleService: RoleService
    ) {
    }

    @ApiOperation({ summary: 'Tìm kiếm danh sách system log' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.SYSTEM_LOGS_VIEW,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.SYSTEM_LOG}/${METHOD.SEARCH}`)
    async searchSystemLogs(@Body() req: SearchDTO) {
        try {
            const resData = await this.systemService.searchSystemLogs(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.SYSTEM_LOGS_VIEW, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Tìm kiếm vai trò' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.ROLE_VIEW,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.ROLE}/${METHOD.SEARCH}`)
    async searchRole(@Body() req: RoleDto) {
        try {
            const resData = await this.roleService.searchRole(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_VIEW, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Tạo mới vai trò' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: MESSAGE_STATUS.ROLE_SUCCESS,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.ROLE}/${METHOD.CREATE}`)
    async createRole(@Body() req: RoleDto) {
        try {
            const resData = await this.roleService.createRole(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_SUCCESS, HttpStatus.CREATED);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Cập nhật vai trò' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.ROLE_UPDATE,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Put(`${ENDPOINT.ROLE}/${METHOD.UPDATE}`)
    async updateRole(@Body() req: RoleDto) {
        try {
            const resData = await this.roleService.updateRole(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_UPDATE, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Chi tiết vai trò' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.ROLE_VIEW,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Get(`${ENDPOINT.ROLE}/${METHOD.DETAIL}/:id`)
    async getRoleById(@Param('id') id: string) {
        try {
            const resData = await this.roleService.detailRole(id);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_VIEW, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Xoá vai trò' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.ROLE_DELETE,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Delete(`${ENDPOINT.ROLE}/${METHOD.DELETE}`)
    async deleteRole(@Body() req: RoleDto) {
        try {
            const resData = await this.roleService.deleteRole(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_DELETE, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Phân quyền cho vai trò' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.ROLE_PERMISSIONS_UPDATE,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.ROLE_PERMISSION}/${METHOD.UPDATE}`)
    async updateRolePermission(@Body() req: RolePermissionDto) {
        try {
            const resData = await this.roleService.updateRolePermission(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_PERMISSIONS_UPDATE, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Tìm kiếm quyền' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.PERMISSION_VIEW,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.ROLE}/${METHOD.SEARCH}`)
    async searchPermission(@Body() req: PermissionDto) {
        try {
            const resData = await this.roleService.searchPermission(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_VIEW, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Tạo mới quyền' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.PERMISSION_SUCCESS,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Post(`${ENDPOINT.PERMISSION}/${METHOD.CREATE}`)
    async createPermission(@Body() req: PermissionDto) {
        try {
            const resData = await this.roleService.createPermission(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_SUCCESS, HttpStatus.CREATED);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Cập nhật quyền' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.PERMISSION_UPDATE,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Put(`${ENDPOINT.PERMISSION}/${METHOD.UPDATE}`)
    async updatePermission(@Body() req: PermissionDto) {
        try {
            const resData = await this.roleService.updatePermission(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_UPDATE, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Chi tiết quyền' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.PERMISSION_VIEW,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Get(`${ENDPOINT.PERMISSION}/${METHOD.DETAIL}/:id`)
    async getPermissionById(@Param('id') id: string) {
        try {
            const resData = await this.roleService.detailPermission(id);
            return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_VIEW, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }

    @ApiOperation({ summary: 'Xóa quyền' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: MESSAGE_STATUS.PERMISSION_DELETE,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
    @Delete(`${ENDPOINT.PERMISSION}/${METHOD.DELETE}`)
    async deletePermission(@Body() req: PermissionDto) {
        try {
            const resData = await this.roleService.deletePermission(req);
            return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_DELETE, HttpStatus.OK);
        } catch (e) {
            throw new HttpException(
                {message: e.message},
                HttpStatus.INTERNAL_SERVER_ERROR,
            )
        }
    }
}
