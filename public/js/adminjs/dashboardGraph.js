
document.getElementById('reportDuration').addEventListener('change', async () => {
   
    const duration = document.getElementById('reportDuration').value

    const response = await fetch(`/admin/graphReport/?duration=${duration}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const data = await response.json();
    console.log(data);



})








