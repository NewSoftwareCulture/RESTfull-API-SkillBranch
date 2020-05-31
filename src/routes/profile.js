import { AsyncRouter } from 'express-async-router';
import bcrypt from 'bcryptjs';
import authCheck from '../middleware/auth';
import models from '../models/models';
import Logger from './Logger';

const router = AsyncRouter();

const User = models.User;

async function checkEmail(email, userId) {
    const otherUser = await User.findOne({email: email});
    if(otherUser && otherUser._id !== userId) throw new Error('Email занят другим пользователем');
}

router.get('/profile', authCheck, async(req, res) => {
    Logger.GET('/profile');
    const userId = req.user._id;
    const user = await User.findOne({_id: userId});
    if(user){
        res.status(200).json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });
    } else{
        res.status(402);
    }
});

router.put('/profile', authCheck, async(req, res) => {
    Logger.PUT('/profile');
    const userId = req.user._id;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const user = await User.findOne({_id: userId});
    if(user) {
        try {
            await checkEmail(email, userId);
            await User.findOneAndUpdate({_id: userId}, { 
                firstName: firstName, 
                lastName: lastName,
                email: email,
            });
            Logger.db('Profile update!');
            const user = await User.findOne({_id: userId});
            res.status(202).json({
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            });
        } catch(e) {
            Logger.ERROR(e.message);
        };
    } else {
        res.status(402).send('402');
    };
});

router.put('/profile/password', authCheck, async(req, res) => {
    Logger.PUT('/profile/password');
    const userId = req.user._id;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const user = await User.findOne({_id: userId});
    if(user){
        const passwordCheck = bcrypt.compareSync(oldPassword, user.password);
        if (passwordCheck) {
            const salt = bcrypt.genSaltSync(10);
            const password = bcrypt.hashSync(newPassword, salt);
            await User.findOneAndUpdate({_id: userId}, { 
                password: password, 
            });
            Logger.db('Password update!');
            res.status(202);
        } else{
            res.status(400);
        };
    } else{
        res.status(402);
    };
});

module.exports = router;