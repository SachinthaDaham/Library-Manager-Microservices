import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) {
      throw new ConflictException('An account with this email already exists.');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashed,
      role: dto.role || 'MEMBER',
    });
    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.buildResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -__v');
    if (!user) throw new UnauthorizedException('User not found.');
    return user;
  }

  async getAllUsers() {
    return this.userModel
      .find()
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.penaltyPoints !== undefined) updateData.penaltyPoints = Math.max(0, dto.penaltyPoints);

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -__v');
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found.`);
    await this.userModel.findByIdAndDelete(id);
  }

  async validateById(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }

  async addPenalty(userId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $inc: { penaltyPoints: 1 } }, { new: true })
      .select('-password -__v');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async removePenalty(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.penaltyPoints = Math.max(0, (user.penaltyPoints || 0) - 1);
    await user.save();
    return this.userModel.findById(userId).select('-password -__v');
  }

  private buildResponse(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        penaltyPoints: user.penaltyPoints || 0,
      },
    };
  }
}
