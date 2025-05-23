import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
    userId:{
        type: String,
        ref: 'User',
        required: true
    },
    cardId:{
        type: String,
        ref: 'Card',
        required: true
    },
    brand:{
        type: String,
        required: true
    },
    last4:{
        type: String,
        required: true
    },
    expMonth:{
        type: Number,
        required: true
    },
    expYear:{
        type: Number,
        required: true
    },
},{timestamps:true});
const Card = mongoose.model('Card', CardSchema);
export default Card;