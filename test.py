import subprocess
result = subprocess.run(['ls', '-l'], stdout=subprocess.PIPE)
print(result.stdout)
