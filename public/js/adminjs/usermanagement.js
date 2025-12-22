
const statusButtons = document.querySelectorAll('.statusbtn');

statusButtons.forEach((button) => {
  button.addEventListener('click', () => {

    if (button.classList.contains('btn-danger')) {
      button.classList.remove('btn-danger');
      button.classList.add('btn-success');
      button.innerHTML = 'Active';
    } else {
      button.classList.remove('btn-success');
      button.classList.add('btn-danger');
      button.innerHTML = 'Blocked';
    }
  });
});

function confirmRemove(productId) {

  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {

      window.location.href = `/admin/removeProduct/${productId}`;
    }
  });
}
