wget --quiet -O miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh 
bash miniconda.sh -b > /dev/null
$HOME/miniconda3/bin/conda create --quiet -n gdal_env -c conda-forge gdal -y 
$HOME/miniconda3/bin/conda init
echo $SHELL
exec $SHELL
$HOME/miniconda3/bin/conda activate gdal_env 