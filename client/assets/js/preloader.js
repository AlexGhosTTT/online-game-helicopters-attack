document.body.onload = () => {

    setTimeout(() => {

        let preloader = document.getElementById('preloader-page');

        if (!preloader.classList.contains('done')) {
            preloader.classList.add('done');
        }

    }, 1000);

};