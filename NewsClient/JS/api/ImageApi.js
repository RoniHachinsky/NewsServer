const IMGBB_CLIENT_ID = 'ef39ab8a3f1c2d58221b8291cfe10340';

// ImgBB - external api for saving image data and returns the url for the image
function uploadImageToImgBB(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onloadend = function () {
        const base64Image = reader.result.split(',')[1];

        $.ajax({
            url: 'https://api.imgbb.com/1/upload',
            type: 'POST',
            data: {
                key: IMGBB_CLIENT_ID, 
                image: base64Image
            },
            success: function (data) {
                if (data.success) {
                    // Return the created url for the image
                    onSuccess(data.data.url)
                } else {
                    onError('Upload failed');
                }
            },
            error: function () {
                onError('Error uploading to ImgBB');
            }
        });
    };
    reader.readAsDataURL(file);
}
