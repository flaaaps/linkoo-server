import mongoose from 'mongoose';

type Model<Type> = Type & mongoose.Document;

export default Model;
