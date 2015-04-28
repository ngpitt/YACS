from bs4 import BeautifulSoup
import requests

def removeTags(tag):
    previous = ''
    word = ''
    words = []
    for x in tag:
        for y in x:
            if (y==" "):
                words.append(word)
                word = ""
            else:
                word = "%s%s" %(word,y)
            previous = y
    return words

def removeNonStrings(line):
    new_line = ''
    #print line
    for letter in line:
        if (letter.isalpha() or letter.isdigit() or letter.isspace()):
            new_line = "%s%s" %(new_line,letter)
    return new_line

if __name__ == "__main__":
    
    semester_id = 13
    course_id = 21969
    
    
    course_id = 23718
    url = "http://catalog.rpi.edu/preview_course_nopop.php?catoid=%d&coid=%d" %(semester_id,course_id)
    
    s = requests.get(url)
    soup = BeautifulSoup(s.content)
    
    class_ = removeTags(soup.h1)
    current_class = "%s %s" %(class_[0],class_[1])
    print current_class
    
    '''
    precoflag = False
    precoreqs = ""
    for x in soup.h1.parent:
        words = ""
        if (x == "\n"):
            continue
        if (precoflag == True):
            string = removeNonStrings(x)
            precoreqs = string
            break
        for y in x:
            if (y.isalpha() or y.isdigit() or y.isspace()):
                words = "%s%s" %(words,y)
        if ("Prerequisites/Corequisites" in y):
            precoflag = True    
    
    #Cannot print " ......
    for x in soup.h1.parent:
        print x
        print "*********************************************"
    '''
    
    preco = []
    while (course_id<24158):
        
        url = "http://catalog.rpi.edu/preview_course_nopop.php?catoid=%d&coid=%d" %(semester_id,course_id)
        
        #info = []
        
        s = requests.get(url)
        soup = BeautifulSoup(s.content)
        precoreqs = ""
        class_name = removeTags(soup.h1)
        class_id = "%s %s" %(class_name[0],class_name[1])
        precoflag = False
        
        for x in soup.h1.parent.strings:
            words = ""
            if (x == "\n"):
                continue
            if (precoflag == True):
                string = removeNonStrings(x)
                precoreqs = string
                break
            for y in x:
                words = "%s%s" %(words,y)
            if ("PrerequisitesCorequisites" in words):
                precoflag = True        
        print class_id
        print precoreqs
        preco.append((class_id,precoreqs))
        course_id += 1
        
    #for x in preco:
    #    print x
    
    #23735 blank page.............
    #Need to allow for a blank page
