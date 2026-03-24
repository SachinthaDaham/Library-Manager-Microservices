import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './book.schema';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<Book>) {}

  private generateUniqueIsbn(): string {
    return `978-${Math.floor(100000000 + Math.random() * 900000000)}`;
  }

  async create(createBookDto: any): Promise<Book> {
    let generatedIsbn = this.generateUniqueIsbn();
    let existing = await this.bookModel.findOne({ isbn: generatedIsbn });
    
    // Safety collision loop to guarantee absolute catalog uniqueness
    while (existing) {
      generatedIsbn = this.generateUniqueIsbn();
      existing = await this.bookModel.findOne({ isbn: generatedIsbn });
    }

    createBookDto.isbn = generatedIsbn;
    createBookDto.availableCopies = createBookDto.totalCopies;
    const newBook = new this.bookModel(createBookDto);
    return newBook.save();
  }

  async findAll(): Promise<Book[]> {
    return this.bookModel.find().exec();
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async update(id: string, updateData: any): Promise<Book> {
    const book = await this.bookModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async remove(id: string): Promise<void> {
    const result = await this.bookModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Book not found');
  }

  // Called synchronously by Borrow Service
  async updateAvailability(id: string, action: 'borrow' | 'return'): Promise<Book> {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');

    if (action === 'borrow') {
      if (book.availableCopies <= 0) throw new BadRequestException('No copies available to borrow');
      book.availableCopies -= 1;
    } else if (action === 'return') {
      if (book.availableCopies >= book.totalCopies) throw new BadRequestException('All copies already returned');
      book.availableCopies += 1;
    }
    
    return book.save();
  }
}
