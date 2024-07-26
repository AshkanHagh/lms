import './configs/cloudinary.config';
import app from './app';

const PORT : number | 9780 = process.env.PORT || 9780;

app.listen(PORT, () => console.log(`Started server on ${PORT}`));