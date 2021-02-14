import axios from 'axios';

export async function generate() {
    return ((await axios.get('https://random-word-api.herokuapp.com/word?number=3')).data as string[])
        .map((word) => word[0].toUpperCase() + word.substring(1, word.length))
        .join('');
}
